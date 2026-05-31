import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { emailVerificationRules, sendVerificationCodeEmail } from "@/lib/email-verification";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export async function POST(request: Request) {
  const body = await request.json();
  const normalizedEmail = String(body.email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (isLocalMode) {
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
        email_verification_code_hash: null,
        email_verification_expires_at: null,
        email_verification_attempts: 0,
        email_verification_sent_at: null,
      },
    });

    return NextResponse.json({ message: "Email verification is disabled in local mode. Your account is ready to use." }, { status: 200 });
  }

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (user.email_verified) {
    return NextResponse.json({ message: "Email is already verified." }, { status: 200 });
  }

  if (user.email_verification_sent_at) {
    const lastSentAt = new Date(user.email_verification_sent_at).getTime();
    const elapsed = Date.now() - lastSentAt;
    const cooldown = emailVerificationRules.resendCooldownSeconds * 1000;
    if (elapsed < cooldown) {
      const waitSeconds = Math.ceil((cooldown - elapsed) / 1000);
      return NextResponse.json({ error: `Please wait ${waitSeconds}s before requesting another code.` }, { status: 429 });
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  console.log("[resend verification debug]", {
    email: normalizedEmail,
    now: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    msUntilExpiry: expiresAt.getTime() - Date.now(),
  });

  await db.user.update({
    where: { id: user.id },
    data: {
      email_verification_code_hash: codeHash,
      email_verification_expires_at: expiresAt,
      email_verification_attempts: 0,
      email_verification_sent_at: new Date(),
      updated_at: new Date(),
    },
  });

  await sendVerificationCodeEmail({
    to: normalizedEmail,
    fullName: user.full_name,
    code,
  });

  return NextResponse.json({ message: "Verification code sent." }, { status: 200 });
}
