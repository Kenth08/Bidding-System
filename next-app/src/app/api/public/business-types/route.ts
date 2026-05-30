import { NextResponse } from "next/server";
import { dbDirect } from "@/lib/db-direct";
import { BUSINESS_TYPES } from "@/lib/business-types";
import { v4 as uuid } from "uuid";

let seeded = false;

async function ensureAllBusinessTypes() {
  if (seeded) return;
  try {
    const existing = await (dbDirect as any).businessType.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((b: any) => b.name.toLowerCase()));
    const missing = BUSINESS_TYPES.filter((name) => !existingNames.has(name.toLowerCase()));
    for (const name of missing) {
      await (dbDirect as any).businessType.upsert({
        where: { name },
        update: { is_active: true },
        create: { id: uuid(), name, description: "", is_active: true },
      });
    }
    seeded = true;
  } catch {
    // If upsert fails, mark seeded to avoid retrying every request
    seeded = true;
  }
}

export async function GET() {
  await ensureAllBusinessTypes();
  const list = await (dbDirect as any).businessType.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
  return NextResponse.json(list.map((b: any) => ({ id: b.id, name: b.name, description: b.description })));
}
