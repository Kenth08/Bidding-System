import { NextResponse } from "next/server";
import { dbDirect } from "@/lib/db-direct";
import { getUserFromRequest } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function getAuthUser(request: Request) {
  const payload = await getUserFromRequest(request);
  if (!payload?.sub) return null;
  const user = await dbDirect.user.findUnique({ id: payload.sub });
  return user;
}

// Helper to extract token from request (cookie or header)
export function getTokenFromRequest(request: Request): string | null {
  // Try cookie first (httpOnly)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map(c => c.trim());
    const accessCookie = cookies.find(c => c.startsWith("access_token="));
    if (accessCookie) {
      return accessCookie.split("=")[1];
    }
  }
  
  // Fallback to Authorization header
  return extractToken(request.headers.get("authorization"));
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
