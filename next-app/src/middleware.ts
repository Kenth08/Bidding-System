import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

const LIMITED_REVISION_ROUTES = [
  "/supplier/revision-required",
  "/supplier/verification-status",
  "/supplier/documents",
  "/supplier/profile",
  "/supplier/notifications",
];

const BLOCKED_SUPPLIER_ROUTES = [
  "/supplier/bidding",
  "/supplier/projects",
  "/supplier/auctions",
  "/supplier/procurement",
  "/supplier/marketplace",
  "/supplier/quotations",
];

function startsWithAny(pathname: string, routes: string[]) {
  return routes.some((route) => pathname.startsWith(route));
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.next();
  }

  try {
    const payload = await verifyToken(accessToken);

    const userId = payload.sub || payload.id;

    if (!userId || payload.role !== "supplier") {
      return NextResponse.next();
    }

    const user = await db.user.findUnique({
      where: { id: String(userId) },
      select: {
        id: true,
        role: true,
        status: true,
        verification_status: true,
        is_active: true,
        session_version: true,
      },
    });

    if (!user || !user.is_active) {
      return clearAuthCookies(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }

    if (
      typeof payload.session_version === "number" &&
      user.session_version !== payload.session_version
    ) {
      return clearAuthCookies(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }

    const accountStatus = user.status || user.verification_status;

    if (
      accountStatus === "waiting_admin_approval" ||
      accountStatus === "waiting_admin_review"
    ) {
      return clearAuthCookies(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }

    if (accountStatus === "revision_required") {
      const isAllowedRevisionPage = startsWithAny(
        pathname,
        LIMITED_REVISION_ROUTES
      );

      const isBlockedSupplierPage = startsWithAny(
        pathname,
        BLOCKED_SUPPLIER_ROUTES
      );

      if (isBlockedSupplierPage || !isAllowedRevisionPage) {
        return NextResponse.redirect(
          new URL("/supplier/revision-required", request.url)
        );
      }

      return NextResponse.next();
    }

    if (accountStatus !== "verified") {
      if (startsWithAny(pathname, BLOCKED_SUPPLIER_ROUTES)) {
        return NextResponse.redirect(
          new URL("/supplier/verification-status", request.url)
        );
      }
    }

    return NextResponse.next();
  } catch {
    return clearAuthCookies(
      NextResponse.redirect(new URL("/login", request.url))
    );
  }
}

export const config = {
  matcher: ["/supplier/:path*"],
};