import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

const protectedPaths: Record<string, string[]> = {
  "/admin": ["admin"],
  "/supplier": ["supplier"],
  "/school-head": ["school_head"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect page routes, not API routes (API routes handle their own auth)
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Check if path needs protection
  const matchedPrefix = Object.keys(protectedPaths).find((p) => pathname.startsWith(p));
  if (!matchedPrefix) return NextResponse.next();

  const token = request.cookies.get("access_token")?.value
    || request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    const allowedRoles = protectedPaths[matchedPrefix];

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*", "/school-head/:path*"],
};
