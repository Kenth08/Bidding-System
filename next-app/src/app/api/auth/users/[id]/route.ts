import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const key of ["full_name", "email", "role", "status", "company_name", "company_address", "phone", "business_type"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.password) data.password_hash = await bcrypt.hash(body.password, 12);

  const user = await db.user.update({ where: { id }, data });
  const { password_hash: _, ...safeUser } = user;
  return json(safeUser);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  await db.user.delete({ where: { id } });
  return json({ success: true });
}
