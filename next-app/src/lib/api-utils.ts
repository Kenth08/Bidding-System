import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function getAuthUser(request: Request) {
  const payload = await getUserFromRequest(request);
  if (!payload?.sub) return null;
  const user = await db.user.findUnique({ where: { id: payload.sub } });
  return user;
}

export async function requireAuth(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return { user: null, error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  return { user, error: null };
}

export async function requireRole(request: Request, ...roles: UserRole[]) {
  const { user, error } = await requireAuth(request);
  if (error) return { user: null, error };
  if (!roles.includes(user!.role as UserRole)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { user: user!, error: null };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
