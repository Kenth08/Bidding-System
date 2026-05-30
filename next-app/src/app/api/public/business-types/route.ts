import { NextResponse } from "next/server";
import { dbDirect } from "@/lib/db-direct";

export async function GET() {
  const list = await (dbDirect as any).businessType.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
  return NextResponse.json(list.map((b: any) => ({ id: b.id, name: b.name, description: b.description })));
}
