import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const authHeader = request.headers.get("authorization") || "";
  
  const hasAccessCookie = cookies.includes("access_token=");
  let token: string | null = null;
  let tokenValid = false;
  let tokenPayload: unknown = null;
  
  if (hasAccessCookie) {
    const cookieValue = cookies.split(";")
      .map(c => c.trim())
      .find(c => c.startsWith("access_token="))
      ?.split("=")[1];
    
    token = cookieValue ?? null;
    
    if (token) {
      const payload = await verifyToken(token);
      tokenValid = !!payload;
      tokenPayload = payload;
    }
  }
  
  const authToken = authHeader.replace("Bearer ", "");
  const hasAuthHeader = authHeader.startsWith("Bearer ");
  
  return NextResponse.json({
    // Request info
    cookies,
    authHeader,
    
    // Cookie analysis
    hasAccessCookie,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    tokenLength: token?.length || 0,
    tokenValid,
    tokenPayload,
    
    // Header analysis  
    hasAuthHeader,
    authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : null,
    authTokenLength: authToken.length || 0,
    
    // Summary
    diagnosis: !hasAccessCookie ? "NO ACCESS COOKIE FOUND" : 
               !tokenValid ? "COOKIE EXISTS BUT TOKEN INVALID" :
               "COOKIE EXISTS AND TOKEN VALID"
  });
}