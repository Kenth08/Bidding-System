import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createClient as refreshSupabaseSession } from "@/utils/supabase/middleware";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

const protectedPaths: Record<string, string[]> = {
  "/admin": ["admin"],
  "/supplier": ["supplier"],
  "/school-head": ["school_head"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseResponse = refreshSupabaseSession(request);

  if (pathname.startsWith("/api")) return supabaseResponse;

  const matchedPrefix = Object.keys(protectedPaths).find((p) => pathname.startsWith(p));
  if (!matchedPrefix) return supabaseResponse;

  const token = request.cookies.get("access_token")?.value
    || request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    const allowedRoles = protectedPaths[matchedPrefix];

    if (!allowedRoles.includes(role)) {
      const redirect = NextResponse.redirect(new URL("/", request.url));
      supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }

    return supabaseResponse;
  } catch (err: any) {
    if (err?.code === "ERR_JWT_EXPIRED") {
      return supabaseResponse;
    }
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*", "/school-head/:path*"],
};