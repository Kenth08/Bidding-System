import { NextResponse } from "next/server";
import { dbDirect } from "@/lib/db-direct";
import { verifyToken, signAccessToken } from "@/lib/auth";

export async function POST(request: Request) {
  // Try to get refresh token from cookie first, then body
  let refreshToken: string | null = null;
  const cookies = request.headers.get("cookie");
  
  if (cookies) {
    const refreshCookie = cookies.split(";")
      .map(c => c.trim())
      .find(c => c.startsWith("refresh_token="));
    
    if (refreshCookie) {
      refreshToken = refreshCookie.split("=")[1];
    }
  }
  
  // Fallback to request body
  if (!refreshToken) {
    const body = await request.json();
    refreshToken = body.refresh;
  }
  
  if (!refreshToken) return NextResponse.json({ error: "Refresh token required." }, { status: 400 });

  const payload = await verifyToken(refreshToken);
  if (!payload?.sub) return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });

  const user = await dbDirect.user.findUnique({ id: payload.sub });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 401 });

  const access = await signAccessToken({ id: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({ access });
  response.cookies.set("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return response;
}
