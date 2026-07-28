import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Startup } from "@/lib/db/models";

/**
 * Server-side proxy to the Microlink screenshot API — the fallback whenever a
 * startup's site blocks iframe embedding (see LiveWebsitePreview). Streams the
 * image back directly instead of redirecting, so:
 *  - the Microlink API key (if a paid plan is used) never reaches the client
 *  - `url` is only ever a website already registered by a real Startup doc in
 *    this tournament — not an open SSRF proxy for arbitrary caller-supplied URLs
 */
const FETCH_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export async function GET(req: Request) {
  const targetUrl = new URL(req.url).searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "url query param is required" }, { status: 400 });
  }

  await dbConnect();
  const isRegisteredStartupUrl = await Startup.exists({ websiteUrl: targetUrl });
  if (!isRegisteredStartupUrl) {
    return NextResponse.json({ error: "Unknown url" }, { status: 403 });
  }

  const microlinkUrl = new URL("https://api.microlink.io/");
  microlinkUrl.searchParams.set("url", targetUrl);
  microlinkUrl.searchParams.set("screenshot", "true");
  microlinkUrl.searchParams.set("meta", "false");
  microlinkUrl.searchParams.set("embed", "screenshot.url");

  const headers: HeadersInit = {};
  if (process.env.MICROLINK_API_KEY) {
    headers["x-api-key"] = process.env.MICROLINK_API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(microlinkUrl, { headers, signal: controller.signal, redirect: "follow" });
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: "Screenshot unavailable" }, { status: 502 });
    }

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Screenshot too large" }, { status: 502 });
    }

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/png",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Screenshot request failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
