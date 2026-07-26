import { Types } from "mongoose";
import { Match, Startup, Tournament } from "@/lib/db/models";
import { generateBracket, getNextSlot, type Entrant } from "./generate";
import { resolveTie, type TieBreakConfig, DEFAULT_TIEBREAK_CONFIG } from "./tiebreak";
import { scheduleRoundAdvance } from "@/lib/tournament/schedule";

/**
 * Called once the 1-hour registration window closes (via QStash/cron).
 * Assigns seeds in registration order, generates the full bracket skeleton,
 * writes round-1 Match docs (auto-completing byes), and flips the tournament
 * to "in_progress".
 */
export async function startTournament(tournamentId: string) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "registration" && tournament.status !== "seeding") {
    throw new Error(`Cannot start tournament in status "${tournament.status}"`);
  }

  const entrantIds = (tournament.entrants ?? []).map((id) => id.toString());
  if (entrantIds.length < tournament.minEntrants) {
    tournament.status = "cancelled";
    await tournament.save();
    return { cancelled: true as const, reason: "insufficient_entrants" };
  }

  // Seed = registration order (entrants array is pushed to in registration order).
  const entrants: Entrant[] = entrantIds.map((id, idx) => ({ id, seed: idx + 1 }));
  await Startup.bulkWrite(
    entrants.map((e) => ({
      updateOne: { filter: { _id: e.id }, update: { $set: { seed: e.seed } } },
    }))
  );

  const bracket = generateBracket(entrants);
  const now = new Date();
  const roundDurationMs = tournament.roundDurationMinutes * 60_000;

  // Create every match doc first (so nextMatch refs can point at real _ids),
  // then fill in nextMatch on the previous round.
  const createdByRoundSlot = new Map<string, Types.ObjectId>();

  for (const round of bracket.rounds) {
    for (const m of round) {
      const isRound1 = m.round === 1;
      const startsAt = isRound1 ? now : new Date(0); // later rounds get real startsAt when they open
      const endsAt = isRound1 ? new Date(now.getTime() + roundDurationMs) : new Date(0);

      const doc = await Match.create({
        tournament: tournament._id,
        round: m.round,
        slot: m.slot,
        startupA: isRound1 ? (m.entrantA ? new Types.ObjectId(m.entrantA.id) : undefined) : undefined,
        startupB: isRound1 ? (m.entrantB ? new Types.ObjectId(m.entrantB.id) : undefined) : undefined,
        status: isRound1 && m.isBye ? "bye" : isRound1 ? "live" : "pending",
        startsAt,
        endsAt,
        winner:
          isRound1 && m.isBye && m.byeWinner ? new Types.ObjectId(m.byeWinner.id) : undefined,
      });

      createdByRoundSlot.set(`${m.round}:${m.slot}`, doc._id);
    }
  }

  // Link nextMatch pointers and propagate bye winners into round 2 immediately.
  for (const round of bracket.rounds) {
    for (const m of round) {
      if (m.round === bracket.totalRounds) continue; // final round has no next match
      const next = getNextSlot(m.round, m.slot);
      const currentId = createdByRoundSlot.get(`${m.round}:${m.slot}`);
      const nextId = createdByRoundSlot.get(`${next.round}:${next.slot}`);
      if (!currentId || !nextId) continue;

      await Match.updateOne({ _id: currentId }, { $set: { nextMatch: nextId } });

      if (m.isBye && m.byeWinner) {
        const field = next.side === "A" ? "startupA" : "startupB";
        await Match.updateOne({ _id: nextId }, { $set: { [field]: new Types.ObjectId(m.byeWinner.id) } });
      }
    }
  }

  tournament.bracketSize = bracket.bracketSize;
  tournament.totalRounds = bracket.totalRounds;
  tournament.currentRound = 1;
  tournament.status = "in_progress";
  await tournament.save();

  try {
    await scheduleRoundAdvance(tournamentId, new Date(now.getTime() + roundDurationMs));
  } catch (err) {
    // QStash not configured (e.g. local dev) — round 1 is live regardless, it just
    // won't auto-advance; trigger /api/cron/advance-round manually instead.
    console.warn("Failed to schedule QStash round-advance job:", err);
  }

  return { cancelled: false as const, bracketSize: bracket.bracketSize, totalRounds: bracket.totalRounds };
}

/**
 * Called by cron once a round's endsAt has passed. Resolves every live match
 * in the round (applying tie-break rules), advances winners into the next
 * round's Match docs, and either opens round+1 or marks the tournament complete.
 */
export async function advanceRound(tournamentId: string, tieBreakConfig: TieBreakConfig = DEFAULT_TIEBREAK_CONFIG) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "in_progress") throw new Error("Tournament is not in progress");

  const round = tournament.currentRound;
  const now = new Date();
  const liveMatches = await Match.find({
    tournament: tournament._id,
    round,
    status: { $in: ["live", "overtime"] },
  });

  const stillPending: typeof liveMatches = [];

  for (const match of liveMatches) {
    const decision = resolveTie(
      {
        votesA: match.votesA,
        votesB: match.votesB,
        firstVoteAAt: match.firstVoteAAt ?? null,
        firstVoteBAt: match.firstVoteBAt ?? null,
        overtimesUsed: match.isOvertime ? 1 : 0,
        now,
      },
      tieBreakConfig
    );

    if (decision.outcome === "overtime") {
      match.status = "overtime";
      match.isOvertime = true;
      match.overtimeEndsAt = decision.endsAt;
      await match.save();
      stillPending.push(match);
      continue;
    }

    if (decision.outcome === "no_votes_tie") {
      // No signal at all (nobody voted) — keep it live a little longer rather
      // than picking an arbitrary winner.
      stillPending.push(match);
      continue;
    }

    const winnerId = decision.side === "A" ? match.startupA : match.startupB;
    const loserId = decision.side === "A" ? match.startupB : match.startupA;
    match.winner = winnerId;
    match.status = "completed";
    await match.save();

    if (loserId) {
      await Startup.updateOne({ _id: loserId }, { $set: { eliminated: true, eliminatedRound: round } });
    }

    if (match.nextMatch && winnerId) {
      const next = getNextSlot(match.round, match.slot);
      const field = next.side === "A" ? "startupA" : "startupB";
      await Match.updateOne({ _id: match.nextMatch }, { $set: { [field]: winnerId } });
    }
  }

  if (stillPending.length > 0) {
    // Round not fully resolved yet (overtime or awaiting late votes) — cron will retry.
    return { roundComplete: false as const, pendingMatches: stillPending.length };
  }

  const isFinalRound = round === tournament.totalRounds;
  if (isFinalRound) {
    const finalMatch = await Match.findOne({ tournament: tournament._id, round });
    tournament.status = "completed";
    tournament.champion = finalMatch?.winner ?? undefined;
    await tournament.save();
    return { roundComplete: true as const, tournamentComplete: true as const };
  }

  const nextRound = round + 1;
  const roundDurationMs = tournament.roundDurationMinutes * 60_000;
  const nextEndsAt = new Date(now.getTime() + roundDurationMs);
  await Match.updateMany(
    { tournament: tournament._id, round: nextRound },
    { $set: { status: "live", startsAt: now, endsAt: nextEndsAt } }
  );
  tournament.currentRound = nextRound;
  await tournament.save();

  try {
    await scheduleRoundAdvance(tournamentId, nextEndsAt);
  } catch (err) {
    console.warn("Failed to schedule QStash round-advance job:", err);
  }

  return { roundComplete: true as const, tournamentComplete: false as const, nextRound };
}
