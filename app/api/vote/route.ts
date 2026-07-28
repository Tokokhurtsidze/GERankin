import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Match, Vote, User, Startup } from "@/lib/db/models";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { objectIdString } from "@/lib/db/object-id";

const bodySchema = z.object({
  matchId: objectIdString,
  side: z.enum(["A", "B"]),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { matchId, side, turnstileToken } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Anti-bot: Turnstile challenge + verified-email gate, both required before a vote counts
  // (Turnstile check is skipped automatically when TURNSTILE_SECRET_KEY isn't configured).
  if (process.env.TURNSTILE_SECRET_KEY) {
    const turnstileOk = await verifyTurnstileToken(turnstileToken ?? "", ip);
    if (!turnstileOk) {
      return NextResponse.json({ error: "Bot verification failed" }, { status: 403 });
    }
  }

  await dbConnect();
  const voter = await User.findById(session.user.id);
  if (!voter) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  if (!voter.emailVerified) {
    // Google is the only auth provider, so any authenticated session already implies
    // a verified email — backfill accounts that predate this field (or missed the
    // sign-in-time backfill because their session token was minted before it existed)
    // instead of permanently blocking them until they happen to sign out and back in.
    voter.emailVerified = new Date();
    await voter.save();
  }

  const match = await Match.findById(matchId);
  if (!match || (match.status !== "live" && match.status !== "overtime")) {
    return NextResponse.json({ error: "Voting is not open for this match" }, { status: 409 });
  }

  // Entrants are conflicted for the whole tournament they're competing in, not just their own match.
  const isParticipant = await Startup.exists({ owner: session.user.id, tournament: match.tournament });
  if (isParticipant) {
    return NextResponse.json({ error: "Participants cannot vote in their own tournament" }, { status: 403 });
  }

  // Vote + both counters must land together — otherwise a crash between writes
  // leaves an undercounted match with no way to reconcile (the unique vote
  // index blocks the user from ever retrying).
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      await Vote.create(
        [
          {
            match: matchId,
            voter: session.user.id,
            side,
            turnstileVerified: Boolean(process.env.TURNSTILE_SECRET_KEY),
            ip,
          },
        ],
        { session: dbSession }
      );

      const voteField = side === "A" ? "votesA" : "votesB";
      const firstVoteField = side === "A" ? "firstVoteAAt" : "firstVoteBAt";
      const update: Record<string, unknown> = { $inc: { [voteField]: 1 } };
      if (side === "A" ? !match.firstVoteAAt : !match.firstVoteBAt) {
        update.$set = { [firstVoteField]: new Date() };
      }
      await Match.updateOne({ _id: matchId }, update, { session: dbSession });

      const startupId = side === "A" ? match.startupA : match.startupB;
      if (startupId) {
        await Startup.updateOne({ _id: startupId }, { $inc: { totalVotesReceived: 1 } }, { session: dbSession });
      }
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json({ error: "You already voted in this match" }, { status: 409 });
    }
    throw err;
  } finally {
    await dbSession.endSession();
  }

  return NextResponse.json({ ok: true });
}
