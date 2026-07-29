import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/connect";
import { Startup, Tournament, ClickAnalytics } from "@/lib/db/models";
import { objectIdString } from "@/lib/db/object-id";

const bodySchema = z.object({
  startupId: objectIdString,
  tournamentId: objectIdString,
  source: z.enum(["card", "showcase", "slides", "leaderboard"]),
});

// In-memory per-IP rate limit — same approach as /api/chat and /api/comments.
const RATE_LIMIT = 20; // clicks
const RATE_WINDOW_MS = 60_000;
const clickLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (clickLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  clickLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { startupId, tournamentId, source } = parsed.data;

  await dbConnect();

  const [startupExists, tournamentExists] = await Promise.all([
    Startup.exists({ _id: startupId }),
    Tournament.exists({ _id: tournamentId }),
  ]);
  if (!startupExists || !tournamentExists) {
    return NextResponse.json({ error: "Unknown startup or tournament" }, { status: 404 });
  }

  const referrer = req.headers.get("referer") ?? undefined;

  // ClickAnalytics.countDocuments is the single source of truth for click counts
  // (see app/[lang]/dashboard/page.tsx) — no denormalized counter to keep in sync.
  await ClickAnalytics.create({ startup: startupId, tournament: tournamentId, source, ip, referrer });

  return NextResponse.json({ ok: true });
}
