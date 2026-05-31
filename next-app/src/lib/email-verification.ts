import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;
const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashVerificationCode(_email: string, code: string) {
  return bcrypt.hash(code, 10);
}

export async function buildVerificationCodePayload(email: string) {
  const code = generateVerificationCode();
  const codeHash = await hashVerificationCode(email, code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  return { code, codeHash, expiresAt };
}

function getSmtpTransport() {
  if (isLocalMode) {
    return null;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatSmtpError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const response = typeof error === "object" && error && "response" in error ? String((error as { response?: unknown }).response || "") : "";

  if (
    code === "535" ||
    response.includes("5.7.8") ||
    response.includes("Username and Password not accepted") ||
    message.includes("Username and Password not accepted")
  ) {
    return new Error(
      "Gmail rejected the SMTP login. Use a Gmail App Password with 2-Step Verification enabled, and make sure SMTP_USER matches the Gmail account that owns the app password."
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export async function sendVerificationCodeEmail(params: { to: string; fullName?: string; code: string }) {
  if (isLocalMode) {
    return;
  }

  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME || "Blockchain E-Procurement";
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL is not configured.");
  }

  const transporter = getSmtpTransport();
  const recipientName = params.fullName?.trim() || "Supplier";
  const subject = "Email Verification Code - Blockchain E-Procurement";
  const text = [
    `Hello ${recipientName},`,
    "",
    "Use this verification code to verify your email address:",
    `${params.code}`,
    "",
    `This code expires in ${CODE_EXPIRY_MINUTES} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 8px;">Email Verification</h2>
      <p style="margin:0 0 16px;">Hello ${recipientName},</p>
      <p style="margin:0 0 12px;">Use this verification code to complete your supplier registration:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f1f5f9;padding:14px 16px;border-radius:10px;display:inline-block;">${params.code}</div>
      <p style="margin:14px 0 0;font-size:13px;color:#475569;">This code expires in ${CODE_EXPIRY_MINUTES} minutes.</p>
      <p style="margin:10px 0 0;font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter!.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: params.to,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw formatSmtpError(error);
  }
}

export async function sendSupplierReuploadConfirmationEmail(to: string) {
  const { sendReuploadConfirmationEmail } = await import("@/lib/email");
  await sendReuploadConfirmationEmail({ to, supplierName: "Supplier" });
}

export const emailVerificationRules = {
  codeLength: CODE_LENGTH,
  codeExpiryMinutes: CODE_EXPIRY_MINUTES,
  resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
  maxAttempts: MAX_VERIFICATION_ATTEMPTS,
};
