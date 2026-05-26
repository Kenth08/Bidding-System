import { SignJWT, jwtVerify } from "jose";
import { User } from "@/types";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

export async function signAccessToken(user: { id: string; email: string; role: string }) {
  return new SignJWT({ sub: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRY || "15m")
    .sign(secret);
}

export async function signRefreshToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRY || "7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; email?: string; role?: string };
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function getUserFromRequest(request: Request) {
  // Try cookie first, then header
  const cookieHeader = request.headers.get("cookie");
  let token: string | null = null;
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map(c => c.trim());
    const accessCookie = cookies.find(c => c.startsWith("access_token="));
    if (accessCookie) {
      token = accessCookie.split("=")[1];
    }
  }
  
  // Fallback to Authorization header
  if (!token) {
    token = extractToken(request.headers.get("authorization"));
  }
  
  if (!token) return null;
  return verifyToken(token);
}


