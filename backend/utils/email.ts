import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your Nyambika password",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; border: 1px solid #e5e5e5;">
            <h2 style="color: #111; margin-top: 0;">Reset your password</h2>
            <p style="color: #555; line-height: 1.6;">
              You requested a password reset for your Nyambika account.
              Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
               style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
            <p style="color: #999; font-size: 13px;">
              If you didn't request this, you can safely ignore this email.
              Your password won't change.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #ccc; font-size: 12px;">Nyambika &mdash; Fashion AI Platform</p>
          </div>
        </body>
      </html>
    `,
  });
}
