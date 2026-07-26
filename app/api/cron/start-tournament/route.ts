import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { dbConnect } from "@/lib/db/connect";
import { Tournament } from "@/lib/db/models";
import { startTournament } from "@/lib/bracket/persist";

/**
 * Scheduled by QStash for exactly registrationClosesAt when the tournament is
 * created (see lib/tournament/schedule.ts), so it fires the instant the 1-hour
 * registration window expires.
 */
async function handler(req: Request) {
  const { tournamentId } = (await req.json()) as { tournamentId: string };

  await dbConnect();
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (tournament.status !== "registration") {
    // Already started/cancelled by a retried delivery — no-op.
    return NextResponse.json({ ok: true, skipped: true });
  }

  const result = await startTournament(tournamentId);
  return NextResponse.json({ ok: true, result });
}

export const POST = verifySignatureAppRouter(handler);
