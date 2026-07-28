import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openrouter, DEFAULT_CHAT_MODEL } from "@/lib/openrouter/client";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are the Startup Clash GE AI Concierge, a floating assistant embedded on a
Georgian startup tournament platform. You help visitors:
- navigate the platform (registration window, dashboard, leaderboard, frontend-slides)
- understand matchup and tournament rules: single-elimination knockout, dynamic bracket
  sizing (2-32 startups rounded up to the next power of 2, with byes for unmatched top seeds),
  one vote per user per match, and tie-break rules (overtime period or earliest-vote priority
  on a 50/50 draw)
- get quick, factual breakdowns of startups competing in the current tournament, using only
  information provided to you in context — never invent startup details, funding, or metrics
Keep answers short and concrete. Respond in the same language the user writes in (Georgian or English).
If asked something outside the platform's scope, say so briefly and redirect to what you can help with.`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

// In-memory per-IP rate limit — no Redis/Upstash wired up in this codebase yet.
// Good enough for a single instance; resets on deploy/restart and won't hold
// across multiple serverless instances, but it's real backpressure where there
// was previously none at all on a route that burns a paid LLM key per request.
const RATE_LIMIT = 15; // requests
const RATE_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests — slow down." }, { status: 429 });
  }

  let messages: UIMessage[];
  try {
    const body = await req.json();
    if (!Array.isArray(body?.messages)) throw new Error("messages must be an array");
    if (body.messages.length > MAX_MESSAGES) throw new Error("too many messages");
    for (const m of body.messages) {
      const text = Array.isArray(m?.parts)
        ? m.parts.map((p: { text?: string }) => p.text ?? "").join("")
        : "";
      if (text.length > MAX_MESSAGE_LENGTH) throw new Error("message too long");
    }
    messages = body.messages;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = streamText({
      model: openrouter(DEFAULT_CHAT_MODEL),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("Chat completion failed:", err);
    return NextResponse.json({ error: "Chat is temporarily unavailable" }, { status: 502 });
  }
}
