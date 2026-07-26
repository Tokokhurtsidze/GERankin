import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { advanceRound } from "@/lib/bracket/persist";

/**
 * Scheduled by QStash for the current round's endsAt each time a round opens
 * (see lib/tournament/schedule.ts). Also safe to invoke via Vercel Cron on a
 * short poll interval as a fallback sweep for overtime/no-vote matches that
 * advanceRound() intentionally leaves pending.
 */
async function handler(req: Request) {
  const { tournamentId } = (await req.json()) as { tournamentId: string };
  const result = await advanceRound(tournamentId);
  return NextResponse.json({ ok: true, result });
}

export const POST = verifySignatureAppRouter(handler);
