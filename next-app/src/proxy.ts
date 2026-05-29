import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

const protectedPaths: Record<string, string[]> = {
  "/admin": ["admin"],
  "/supplier": ["supplier"],
  "/school-head": ["school_head"],
};

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
    const allowedRoles = protectedPaths[matchedPrefix];

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (role === "supplier" && pathname.startsWith("/supplier")) {
      try {
        const workflowResponse = await fetch(new URL("/api/auth/supplier-documents", request.url), {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        });

        if (workflowResponse.ok) {
          const workflow = await workflowResponse.json();
          const accessState = String(workflow?.accessState || "restricted");
          const accountStatus = String(workflow?.accountStatus || "");
          const allowedRevisionPaths = [
            "/supplier/revision-required",
            "/supplier/verification",
            "/supplier/verification-status",
            "/supplier/profile",
            "/supplier/notifications",
            "/supplier/documents",
          ];

          if (accountStatus === "waiting_admin_approval" || accountStatus === "waiting_admin_review") {
            return NextResponse.redirect(new URL("/login?error=under_review", request.url));
          }

          if (accessState === "revision_required") {
            const isAllowedPath = allowedRevisionPaths.some((path) => pathname.startsWith(path));
            if (!isAllowedPath) {
              return NextResponse.redirect(new URL("/supplier/revision-required", request.url));
            }
          } else if (accessState !== "verified") {
            return NextResponse.redirect(new URL("/supplier/verification-status", request.url));
          }
        }
      } catch {
        // If the workflow check fails, fall through and let the app handle it.
      }
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