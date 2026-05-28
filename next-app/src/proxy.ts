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

    if (role === "supplier" && pathname.startsWith("/supplier") && !pathname.startsWith("/supplier/documents/reupload")) {
      try {
        const workflowResponse = await fetch(new URL("/api/auth/supplier-documents", request.url), {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        });

        if (workflowResponse.ok) {
          const workflow = await workflowResponse.json();
          if (workflow?.accountLocked) {
            return NextResponse.redirect(new URL("/supplier/documents/reupload", request.url));
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