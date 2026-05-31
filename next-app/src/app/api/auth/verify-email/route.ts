import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { emailVerificationRules } from "@/lib/email-verification";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

/** Parse a timestamp from the database as UTC, regardless of whether it includes a Z suffix */
function parseAsUTC(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value);
  // If the string already has timezone info, parse directly
  if (str.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(str)) {
    return new Date(str);
  }
  // Otherwise append Z to interpret as UTC (Supabase returns timestamp without tz info)
  return new Date(str + "Z");
}

export async function POST(request: Request) {
  const body = await request.json();
  const normalizedEmail = String(body.email || "").trim().toLowerCase();
  const cleanCode = String(body.code || "").replace(/\D/g, "");

  if (!normalizedEmail || !cleanCode) {
    return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
  }

  if (cleanCode.length !== 6) {
    return NextResponse.json({ error: "Please enter a valid 6-digit code." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
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
  const expiresAt = parseAsUTC(user.email_verification_expires_at);

  console.log("[verify email debug]", {
    email: normalizedEmail,
    now: now.toISOString(),
    rawExpiresAt: user.email_verification_expires_at,
    expiresAt: expiresAt?.toISOString(),
    msUntilExpiry: expiresAt ? expiresAt.getTime() - now.getTime() : null,
    hasCodeHash: !!user.email_verification_code_hash,
    cleanCodeLength: cleanCode.length,
  });

  if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
    return NextResponse.json({ error: "Verification code has expired. Please request a new code." }, { status: 400 });
  }

  // Check max attempts
  const attempts = Number(user.email_verification_attempts || 0);
  if (attempts >= emailVerificationRules.maxAttempts) {
    return NextResponse.json({ error: "Too many invalid attempts. Please request a new code." }, { status: 429 });
  }

  // Compare using bcrypt
  const isCodeValid = await bcrypt.compare(cleanCode, user.email_verification_code_hash);
  if (!isCodeValid) {
    await db.user.update({
      where: { id: user.id },
      data: { email_verification_attempts: attempts + 1 },
    });
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  // Success - mark verified
  await db.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verified_at: new Date(),
      email_verification_code_hash: null,
      email_verification_expires_at: null,
      email_verification_attempts: 0,
    },
  });

  return NextResponse.json({
    message: "Email verified successfully. Your supplier account is now waiting for admin approval.",
  }, { status: 200 });
}
