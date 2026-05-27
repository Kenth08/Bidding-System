import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildVerificationCodePayload, emailVerificationRules, sendVerificationCodeEmail } from "@/lib/email-verification";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
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

  const verification = buildVerificationCodePayload(email);

  await db.user.update({
    where: { id: user.id },
    data: {
      email_verification_code_hash: verification.codeHash,
      email_verification_expires_at: verification.expiresAt,
      email_verification_attempts: 0,
      email_verification_sent_at: new Date(),
    },
  });

  await sendVerificationCodeEmail({
    to: email,
    fullName: user.full_name,
    code: verification.code,
  });

  return NextResponse.json({ message: "Verification code sent." }, { status: 200 });
}