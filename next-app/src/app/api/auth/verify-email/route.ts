import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailVerificationRules, hashVerificationCode } from "@/lib/email-verification";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (user.email_verified) {
    return NextResponse.json({ message: "Email is already verified." }, { status: 200 });
  }

  if (isLocalMode) {
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

    return NextResponse.json({ message: "Email verified successfully." }, { status: 200 });
  }

  if (!user.email_verification_code_hash || !user.email_verification_expires_at) {
    return NextResponse.json({ error: "No verification code found. Please request a new code." }, { status: 400 });
  }

  const now = new Date();
  const expiry = new Date(user.email_verification_expires_at);
  if (expiry < now) {
    return NextResponse.json({ error: "Verification code has expired. Please request a new code." }, { status: 400 });
  }

  const attempts = Number(user.email_verification_attempts || 0);
  if (attempts >= emailVerificationRules.maxAttempts) {
    return NextResponse.json({ error: "Too many invalid attempts. Please request a new code." }, { status: 429 });
  }

  const receivedCodeHash = hashVerificationCode(email, code);
  if (receivedCodeHash !== user.email_verification_code_hash) {
    await db.user.update({
      where: { id: user.id },
      data: { email_verification_attempts: attempts + 1 },
    });

    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verified_at: now,
      email_verification_code_hash: null,
      email_verification_expires_at: null,
      email_verification_attempts: 0,
    },
  });

  return NextResponse.json({ message: "Email verified successfully." }, { status: 200 });
}