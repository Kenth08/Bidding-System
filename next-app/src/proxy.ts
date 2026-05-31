import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

const protectedPaths: Record<string, string[]> = {
  "/admin": ["admin"],
  "/supplier": ["supplier"],
  "/school-head": ["school_head"],
};

const ALLOWED_WHEN_REVISION_REQUIRED = [
  "/supplier/revision-required",
  "/supplier/verification-status",
  "/supplier/profile",
  "/supplier/notifications",
  "/supplier/documents/reupload",
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

    // Supplier access control based on verification_status in JWT
    if (role === "supplier" && pathname.startsWith("/supplier")) {
      if (status === "waiting_admin_approval" || status === "waiting_admin_review") {
        const res = NextResponse.redirect(new URL("/login?error=under_review", request.url));
        res.cookies.delete("access_token");
        res.cookies.delete("refresh_token");
        return res;
      }

      if (status === "revision_required") {
        const isAllowed = ALLOWED_WHEN_REVISION_REQUIRED.some((p) => pathname.startsWith(p));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/supplier/revision-required", request.url));
        }
      }
      // verified: allow all supplier routes
    }

    return NextResponse.next();
  } catch (err: any) {
    if (err?.code === "ERR_JWT_EXPIRED") {
      // Let the page load; client-side will handle refresh
      return NextResponse.next();
    }
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*", "/school-head/:path*"],
};
