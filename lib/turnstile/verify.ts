const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  if (!token) return false;

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY as string,
      response: token,
      remoteip: ip,
    }),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
