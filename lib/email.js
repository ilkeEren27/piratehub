import { Resend } from "resend";

// Created lazily so importing this module never crashes when the
// RESEND_API_KEY env var isn't set (e.g. during builds).
let resendClient;
const getResend = () => {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

// Sender address. Use "PirateHub <onboarding@resend.dev>" until you verify
// your own domain in Resend, then switch to e.g. "PirateHub <noreply@yourdomain.com>".
const FROM = process.env.EMAIL_FROM || "PirateHub <onboarding@resend.dev>";

// Shared wrapper so all auth emails look the same. Edit freely — this is
// plain HTML, nothing here is dictated by the auth library.
function layout({ title, body, buttonText, buttonUrl }) {
  return `
  <div style="background:#f6f6f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="background:#a6192e;padding:20px 32px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">PirateHub</span>
      </div>
      <div style="padding:32px;">
        <h1 style="font-size:20px;color:#111111;margin:0 0 16px;">${title}</h1>
        <p style="font-size:15px;line-height:1.6;color:#444444;margin:0 0 24px;">${body}</p>
        <a href="${buttonUrl}"
           style="display:inline-block;background:#a6192e;color:#ffffff;text-decoration:none;
                  padding:12px 24px;border-radius:8px;font-size:15px;font-weight:bold;">
          ${buttonText}
        </a>
        <p style="font-size:13px;line-height:1.6;color:#888888;margin:24px 0 0;">
          If the button doesn't work, copy this link into your browser:<br/>
          <a href="${buttonUrl}" style="color:#a6192e;word-break:break-all;">${buttonUrl}</a>
        </p>
        <p style="font-size:13px;color:#888888;margin:24px 0 0;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#999999;margin:16px 0 0;">
      PirateHub — Campus Hub for Pirates
    </p>
  </div>`;
}

export async function sendVerificationEmail({ user, url }) {
  await getResend().emails.send({
    from: FROM,
    to: user.email,
    subject: "Verify your PirateHub email",
    html: layout({
      title: `Ahoy, ${user.name || "Pirate"}! 🏴‍☠️`,
      body: "Welcome aboard PirateHub. Click the button below to verify your email address and activate your account.",
      buttonText: "Verify my email",
      buttonUrl: url,
    }),
  });
}

export async function sendPasswordResetEmail({ user, url }) {
  await getResend().emails.send({
    from: FROM,
    to: user.email,
    subject: "Reset your PirateHub password",
    html: layout({
      title: "Password reset requested",
      body: "Someone (hopefully you) asked to reset the password for this account. Click the button below to choose a new password. This link expires in 1 hour.",
      buttonText: "Reset my password",
      buttonUrl: url,
    }),
  });
}
