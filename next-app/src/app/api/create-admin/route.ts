import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbDirect } from "@/lib/db-direct";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    // Check if admin exists
    const admin = await dbDirect.user.findUnique({ email: "admin@gmail.com" });
    
    if (admin) {
      return NextResponse.json({ 
        message: "Admin already exists",
        admin: { email: admin.email, role: admin.role, status: admin.status }
      });
    }
    
    // Create admin
    const password_hash = await bcrypt.hash("admin123", 12);
    const newAdmin = await dbDirect.user.create({
      id: uuid(),
      full_name: "System Administrator",
      email: "admin@gmail.com",
      password_hash,
      role: "admin",
      status: "active",
      company_name: "System",
      is_active: true,
      is_staff: true,
      is_superuser: true
    });
    
    return NextResponse.json({ 
      message: "Admin created successfully",
      admin: { email: newAdmin.email, role: newAdmin.role }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: "Check database connection"
    }, { status: 500 });
  }
}