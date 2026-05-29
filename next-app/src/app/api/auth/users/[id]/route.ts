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

  for (const key of ["full_name", "email", "role", "status", "company_name", "company_address", "phone", "business_type", "representative_name", "tin", "company_profile", "email_verified"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.password) data.password_hash = await bcrypt.hash(body.password, 12);
  if (body.email_verified === true) data.email_verified_at = new Date();

  const user = await db.user.update({ where: { id }, data });
  const { password_hash, ...safeUser } = user as any;
  return json(safeUser);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  await db.user.delete({ where: { id } });
  return json({ success: true });
}
