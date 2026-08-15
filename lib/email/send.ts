import type { ReactElement } from "react";
import { Resend } from "resend";

// Resend's sandbox sender only reliably delivers to the account owner's own
// inbox — shipping this to production silently means real users never get
// any email. Loud at cold-start instead of a per-send console.error nobody sees.
if (process.env.NODE_ENV === "production" && process.env.EMAIL_FROM?.endsWith("@resend.dev")) {
  console.error(
    "[email] EMAIL_FROM is Resend's sandbox address (*@resend.dev) in production — " +
      "real users will not receive emails until a custom domain is verified in Resend and EMAIL_FROM is updated."
  );
}

let client: Resend | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client = new Resend(apiKey);
  return client;
}

type SendMailArgs = { to: string; subject: string } & ({ html: string; react?: never } | { react: ReactElement; html?: never });

export async function sendMail({ to, subject, html, react }: SendMailArgs) {
  const resend = getClient();
  if (!resend || !process.env.EMAIL_FROM) {
    console.warn("RESEND_API_KEY/EMAIL_FROM not configured — skipping email:", subject);
    return;
  }
  const { error } = await resend.emails.send(
    html !== undefined
      ? { from: process.env.EMAIL_FROM, to, subject, html }
      : { from: process.env.EMAIL_FROM, to, subject, react: react! }
  );
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
