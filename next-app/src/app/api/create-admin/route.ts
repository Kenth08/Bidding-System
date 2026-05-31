import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: Request) {
  try {
    // Check if admin exists
    const admin = await db.user.findUnique({ where: { email: "admin@gmail.com" } });
    const url = new URL(request.url);
    const reset = url.searchParams.get('reset') === 'true';

    if (admin && !reset) {
      return NextResponse.json({ 
        message: "Admin already exists",
        admin: { email: admin.email, role: admin.role, status: admin.status }
      });
    }
    
    // Create or reset admin
    const password_hash = await bcrypt.hash("admin123", 12);
    if (admin && reset) {
      const updated = await db.user.update({ where: { id: admin.id }, data: { password_hash } });
      return NextResponse.json({ message: "Admin password reset", admin: { email: updated.email, role: updated.role } });
    }

    const newAdmin = await db.user.create({
      data: {
        id: uuid(),
        full_name: "System Administrator",
        email: "admin@gmail.com",
        password_hash,
        role: "admin",
        status: "active",
        company_name: "System",
        is_active: true,
        is_staff: true,
        is_superuser: true,
      },
    });

    return NextResponse.json({ message: "Admin created successfully", admin: { email: newAdmin.email, role: newAdmin.role } });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: "Check database connection"
    }, { status: 500 });
  }
}