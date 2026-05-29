import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
          configured: {
            SMTP_HOST: Boolean(host),
            SMTP_PORT: Boolean(process.env.SMTP_PORT),
            SMTP_USER: Boolean(user),
            SMTP_PASS: Boolean(process.env.SMTP_PASS),
          },
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // Auth test only (does not send an email)
    await transporter.verify();

    return NextResponse.json({ ok: true, message: "SMTP authentication succeeded." });
  } catch (e: any) {
    // Do not leak SMTP_PASS
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || String(e),
        // Helpful but still avoid leaking secrets
        code: e?.code,
        responseCode: e?.responseCode,
        response: e?.response,
      },
      { status: 500 }
    );
  }
}

