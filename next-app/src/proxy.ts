import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

const protectedPaths: Record<string, string[]> = {
  "/admin": ["admin"],
  "/supplier": ["supplier"],
  "/school-head": ["school_head"],
};

const ALLOWED_WHEN_RESTRICTED = [
  "/supplier/revision-required",
  "/supplier/verification",
  "/supplier/verification-status",
  "/supplier/profile",
  "/supplier/notifications",
  "/supplier/documents",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) return NextResponse.next();

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
    const status = (payload.status as string) || "";
    const allowedRoles = protectedPaths[matchedPrefix];

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Supplier access control based on JWT status claim (no DB call needed)
    if (role === "supplier" && pathname.startsWith("/supplier")) {
      if (status === "waiting_admin_approval" || status === "waiting_admin_review") {
        return NextResponse.redirect(new URL("/login?error=under_review", request.url));
      }

      if (status === "revision_required") {
        const isAllowed = ALLOWED_WHEN_RESTRICTED.some((p) => pathname.startsWith(p));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/supplier/revision-required", request.url));
        }
      }
      // For approved/verified/active suppliers, allow all routes
    }

    return NextResponse.next();
  } catch (err: any) {
    if (err?.code === "ERR_JWT_EXPIRED") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*", "/school-head/:path*"],
};
