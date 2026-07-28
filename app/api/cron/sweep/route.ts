import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, Match } from "@/lib/db/models";
import { startTournament, advanceRound } from "@/lib/bracket/persist";

/**
 * Polled by Vercel Cron (see vercel.json). Replaces the old QStash exact-time
 * scheduling: instead of one job per tournament/round, this just checks every
 * open tournament against the clock each run.
 */
export async function GET(req: Request) {
  // Fail closed: an unset CRON_SECRET must not mean "anyone can trigger this,"
  // it means the deploy is misconfigured.
  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET is not configured — refusing to run /api/cron/sweep");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const now = new Date();
  const results: Record<string, unknown> = {};

  const closedRegistrations = await Tournament.find({
    status: "registration",
    registrationClosesAt: { $lte: now },
  });
  for (const tournament of closedRegistrations) {
    const id = tournament._id.toString();
    try {
      results[`start:${id}`] = await startTournament(id);
    } catch (err) {
      console.error(`Sweep: failed to start tournament ${id}:`, err);
      results[`start:${id}`] = { error: String(err) };
    }
  }

  const inProgress = await Tournament.find({ status: "in_progress" });
  for (const tournament of inProgress) {
    const id = tournament._id.toString();
    try {
      const dueMatch = await Match.findOne({
        tournament: tournament._id,
        round: tournament.currentRound,
        $or: [
          { status: "live", endsAt: { $lte: now } },
          { status: "overtime", overtimeEndsAt: { $lte: now } },
        ],
      });
      if (dueMatch) {
        results[`advance:${id}`] = await advanceRound(id);
      }
    } catch (err) {
      console.error(`Sweep: failed to advance tournament ${id}:`, err);
      results[`advance:${id}`] = { error: String(err) };
    }
  }

  return NextResponse.json({ ok: true, results });
}
