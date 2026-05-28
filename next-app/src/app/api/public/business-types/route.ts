import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const list = await db.businessType.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
  return NextResponse.json(list.map((b: any) => ({ id: b.id, name: b.name, description: b.description })));
}
