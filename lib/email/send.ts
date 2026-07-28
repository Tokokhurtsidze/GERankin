import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const t = getTransporter();
  if (!t) {
    console.warn("EMAIL_USER/EMAIL_APP_PASSWORD not configured — skipping email:", subject);
    return;
  }
  await t.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
}
