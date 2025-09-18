import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resend = getResend();
    const toEmail = process.env.NEXT_PUBLIC_CONTACT_TO || "info@nyambika.com";
    const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";

    if (!resend) {
      // Safe fallback when API key is not configured
      console.log("[Contact] (fallback log)", { name, email, message });
      return NextResponse.json({ ok: true, fallback: true });
    }

    const subject = `New contact from ${name}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
        <h2>Nyambika Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${String(message)
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>")}</p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject,
      html,
    } as any);

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
