import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/connect";
import { Startup, ClickAnalytics } from "@/lib/db/models";

const bodySchema = z.object({
  startupId: z.string().min(1),
  tournamentId: z.string().min(1),
  source: z.enum(["card", "showcase", "slides", "leaderboard"]),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { startupId, tournamentId, source } = parsed.data;

  await dbConnect();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const referrer = req.headers.get("referer") ?? undefined;

  await Promise.all([
    ClickAnalytics.create({ startup: startupId, tournament: tournamentId, source, ip, referrer }),
    Startup.updateOne({ _id: startupId }, { $inc: { clickCount: 1 } }),
  ]);

  return NextResponse.json({ ok: true });
}
