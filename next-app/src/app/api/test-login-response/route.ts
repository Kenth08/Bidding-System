import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbDirect } from "@/lib/db-direct";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

export async function GET() {
  try {
    // Test with admin credentials
    const email = "admin@gmail.com";
    const password = "admin123";
    
    const user = await dbDirect.user.findUnique({ email });
    
    if (!user) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    
    // Generate tokens
    const access = await signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refresh = await signRefreshToken(user.id);
    
    return NextResponse.json({
      success: true,
      message: "Login test successful",
      hasAccessToken: !!access,
      accessTokenLength: access?.length || 0,
      hasRefreshToken: !!refresh,
      user: { id: user.id, email: user.email, role: user.role },
      // Don't expose full tokens in test
      tokenPreview: {
        access: access ? `${access.substring(0, 20)}...` : null,
        refresh: refresh ? `${refresh.substring(0, 20)}...` : null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}