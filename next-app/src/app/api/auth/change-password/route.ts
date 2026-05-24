import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-utils";

export async function POST(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const currentPassword = String(body.current_password || "").trim();
  const newPassword = String(body.new_password || "").trim();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user!.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: user!.id }, data: { password_hash } });

  return NextResponse.json({ message: "Password changed successfully." });
}
