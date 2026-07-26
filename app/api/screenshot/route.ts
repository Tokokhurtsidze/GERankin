import { NextResponse } from "next/server";

/**
 * Thin server-side proxy to the Microlink screenshot API. Used as the fallback
 * whenever a startup's site blocks iframe embedding (see LiveWebsitePreview).
 * Proxying keeps the Microlink API key (if a paid plan is used) off the client.
 */
export async function GET(req: Request) {
  const targetUrl = new URL(req.url).searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "url query param is required" }, { status: 400 });
  }

  const microlinkUrl = new URL("https://api.microlink.io/");
  microlinkUrl.searchParams.set("url", targetUrl);
  microlinkUrl.searchParams.set("screenshot", "true");
  microlinkUrl.searchParams.set("meta", "false");

  const headers: HeadersInit = {};
  if (process.env.MICROLINK_API_KEY) {
    headers["x-api-key"] = process.env.MICROLINK_API_KEY;
  }

  const res = await fetch(microlinkUrl, { headers, next: { revalidate: 3600 } });
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
