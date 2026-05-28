import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dbDirect } from "@/lib/db-direct";

export async function GET() {
  const businessTypeDb = (db as any).businessType ?? (dbDirect as any).businessType;
  const list = await businessTypeDb.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
  return NextResponse.json(list.map((b: any) => ({ id: b.id, name: b.name, description: b.description })));
}
