import type { NextConfig } from "next";

// Pragmatic baseline CSP: the app needs 'unsafe-inline'/'unsafe-eval' for Next's
// own hydration/Tailwind inline styles, and broad img-src/frame-src because
// startups register arbitrary logo/website URLs (LiveWebsitePreview embeds them
// in an iframe, next/image fetches them) — this isn't a strict lockdown, but it
// closes the "nothing at all" gap: blocks framing this site, restricts base/form
// hijacking, and scopes script/style/connect sources.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    // Startup logoUrl is a user-submitted URL from any site (registration form,
    // no upload/storage step) — has to allow arbitrary hosts or next/image 500s
    // on the first logo from an unlisted domain.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
