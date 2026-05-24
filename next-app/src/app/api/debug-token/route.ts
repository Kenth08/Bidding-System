import { NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request: Request) {
  const token = extractToken(request.headers.get("authorization"));
  
  if (!token) {
    return NextResponse.json({ 
      error: "No token provided",
      headers: Object.fromEntries(request.headers.entries())
    }, { status: 401 });
  }
  
  try {
    const payload = await verifyToken(token);
    
    return NextResponse.json({
      success: true,
      message: "Token is valid",
      payload,
      tokenPreview: `${token.substring(0, 20)}...`,
      tokenLength: token.length
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Token validation failed",
      message: error.message,
      tokenPreview: `${token.substring(0, 20)}...`
    }, { status: 401 });
  }
}