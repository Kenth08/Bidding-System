import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { password_hash: _, ...safeUser } = user!;
  return json(safeUser);
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const allowed = ["full_name", "company_name", "company_address", "phone", "business_type", "representative_name", "tin", "company_profile"] as const;
  const data: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = String(body[key]);
  }

  const updated = await db.user.update({ where: { id: user!.id }, data });
  const { password_hash: _, ...safeUser } = updated;
  return json(safeUser);
}
