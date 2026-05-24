import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(request, "admin");
    if (error) return error;
    const users = await db.user.findMany({ orderBy: { created_at: "desc" } });
    const safe = users.map(({ password_hash: _, ...u }) => u);
    return json(safe);
  } catch (error) {
    console.error("[api/auth/users]", error);
    return json({ error: error instanceof Error ? error.message : "Failed to load users." }, 500);
  }
}

export async function POST(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const body = await request.json();
  const password_hash = body.password ? await bcrypt.hash(body.password, 12) : await bcrypt.hash("default123", 12);

  const user = await db.user.create({
    data: {
      id: uuid(),
      full_name: body.full_name || "",
      email: body.email,
      password_hash,
      role: body.role || "viewer",
      status: body.status || "active",
      company_name: body.company_name || "",
      company_address: body.company_address || "",
      phone: body.phone || "",
      business_type: body.business_type || "",
    },
  });

  const { password_hash: _, ...safeUser } = user;
  return json(safeUser, 201);
}
