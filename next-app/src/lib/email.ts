import nodemailer from "nodemailer";

interface RevisionItem {
  documentName: string;
  reason: string;
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(input: SendEmailInput) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP settings missing. Email not sent.", input.subject);
    return;
  }

  const sendPromise = transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS || 8000);
  await Promise.race([
    sendPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP timeout")), timeoutMs)),
  ]);
}

export async function sendRevisionRequiredEmail(params: {
  to: string;
  supplierName: string;
  loginUrl: string;
  flaggedDocuments: RevisionItem[];
}) {
  const lines = params.flaggedDocuments.map((d) => `- ${d.documentName}: ${d.reason}`).join("\n");
  const text = [
    `Hello ${params.supplierName},`,
    "",
    "Your supplier verification documents require revision. Please log in to your account and upload the corrected requirements.",
    "",
    "Flagged documents:",
    lines || "- Required document is missing or invalid.",
    "",
    `Login: ${params.loginUrl}`,
  ].join("\n");

  await sendEmail({
    to: params.to,
    subject: "Supplier Verification Documents Require Revision",
    text,
  });
}

export async function sendSupplierApprovedEmail(params: { to: string; supplierName: string }) {
  await sendEmail({
    to: params.to,
    subject: "Supplier Account Approved",
    text: [
      `Hello ${params.supplierName},`,
      "",
      "Your supplier account has been fully verified and approved. You may now log in and access the bidding system.",
    ].join("\n"),
  });
}

export async function sendDocumentRejectedEmail(params: {
  to: string;
  supplierName: string;
  documentName: string;
  reason: string;
  loginUrl: string;
}) {
  await sendEmail({
    to: params.to,
    subject: "Supplier Document Rejected",
    text: [
      `Hello ${params.supplierName},`,
      "",
      `The document \"${params.documentName}\" was rejected.`,
      `Reason: ${params.reason}`,
      "",
      `Please upload a corrected document: ${params.loginUrl}`,
    ].join("\n"),
  });
}

export async function sendReuploadConfirmationEmail(params: { to: string; supplierName: string }) {
  await sendEmail({
    to: params.to,
    subject: "Corrected Documents Submitted",
    text: [
      `Hello ${params.supplierName},`,
      "",
      "Your corrected documents have been submitted successfully. Please wait for admin approval.",
    ].join("\n"),
  });
}
