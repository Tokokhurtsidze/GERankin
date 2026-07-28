import { Types } from "mongoose";
import { Match, Startup, Tournament } from "@/lib/db/models";
import { generateBracket, getNextSlot, type Entrant } from "./generate";
import { resolveTie, type TieBreakConfig, DEFAULT_TIEBREAK_CONFIG } from "./tiebreak";
import { notifyTournamentStarted, notifyRoundStarted, notifyMatchResults, notifyChampion } from "@/lib/email/notify";

type NotifiableStartup = { _id: Types.ObjectId; name: string; owner?: { email?: string } | null };

function toRecipients(startups: NotifiableStartup[]) {
  return startups
    .filter((s): s is NotifiableStartup & { owner: { email: string } } => Boolean(s.owner?.email))
    .map((s) => ({ email: s.owner.email, startupName: s.name }));
}

/**
 * Called once the 1-hour registration window closes (via the /api/cron/sweep poll).
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
    tournament.activeLock = undefined;
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
  const byeWinnerIds: string[] = [];
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
        byeWinnerIds.push(m.byeWinner.id);
      }
    }
  }

  tournament.bracketSize = bracket.bracketSize;
  tournament.totalRounds = bracket.totalRounds;
  tournament.currentRound = 1;
  tournament.status = "in_progress";
  await tournament.save();

  const entrantStartups = await Startup.find({ _id: { $in: entrantIds } })
    .select("name owner")
    .populate<{ owner?: { email?: string } }>({ path: "owner", select: "email" });

  await notifyTournamentStarted(toRecipients(entrantStartups), tournament.name);

  const byeWinners = entrantStartups.filter((s) => byeWinnerIds.includes(s._id.toString()));
  if (byeWinners.length > 0) {
    await notifyMatchResults(
      toRecipients(byeWinners).map((r) => ({ ...r, round: 1, advanced: true })),
      tournament.name
    );
  }

  return { cancelled: false as const, bracketSize: bracket.bracketSize, totalRounds: bracket.totalRounds };
}

/**
 * Called by /api/cron/sweep once a round's endsAt has passed. Resolves every live match
 * in the round (applying tie-break rules), advances winners into the next
 * round's Match docs, and either opens round+1 or marks the tournament complete.
 */
export async function advanceRound(tournamentId: string, tieBreakConfig: TieBreakConfig = DEFAULT_TIEBREAK_CONFIG) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "in_progress") throw new Error("Tournament is not in progress");

  const round = tournament.currentRound;
  const isFinalRound = round === tournament.totalRounds;
  const now = new Date();
  type PopulatedStartup = { _id: Types.ObjectId; seed?: number; name: string; owner?: { email?: string } };
  const liveMatches = await Match.find({
    tournament: tournament._id,
    round,
    status: { $in: ["live", "overtime"] },
  }).populate<{ startupA?: PopulatedStartup; startupB?: PopulatedStartup }>([
    { path: "startupA", select: "seed name owner", populate: { path: "owner", select: "email" } },
    { path: "startupB", select: "seed name owner", populate: { path: "owner", select: "email" } },
  ]);

  const stillPending: typeof liveMatches = [];
  const matchResultNotifications: { email: string; startupName: string; round: number; advanced: boolean }[] = [];
  let championNotification: { email: string; startupName: string } | null = null;

  for (const match of liveMatches) {
    const decision = resolveTie(
      {
        votesA: match.votesA,
        votesB: match.votesB,
        firstVoteAAt: match.firstVoteAAt ?? null,
        firstVoteBAt: match.firstVoteBAt ?? null,
        overtimesUsed: match.overtimesUsed ?? 0,
        seedA: match.startupA?.seed ?? null,
        seedB: match.startupB?.seed ?? null,
        now,
      },
      tieBreakConfig
    );

    if (decision.outcome === "overtime") {
      match.status = "overtime";
      match.overtimesUsed = (match.overtimesUsed ?? 0) + 1;
      match.overtimeEndsAt = decision.endsAt;
      await match.save();
      stillPending.push(match);
      continue;
    }

    if (decision.outcome === "no_votes_tie") {
      // Only reached if a seed is somehow missing on both sides (shouldn't happen
      // post-seeding) — keep it live rather than picking an arbitrary winner.
      stillPending.push(match);
      continue;
    }

    const winner = decision.side === "A" ? match.startupA : match.startupB;
    const loser = decision.side === "A" ? match.startupB : match.startupA;
    const winnerId = winner?._id;
    const loserId = loser?._id;
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

    if (loser?.owner?.email) {
      matchResultNotifications.push({ email: loser.owner.email, startupName: loser.name, round, advanced: false });
    }
    if (winner?.owner?.email) {
      if (isFinalRound) {
        championNotification = { email: winner.owner.email, startupName: winner.name };
      } else {
        matchResultNotifications.push({ email: winner.owner.email, startupName: winner.name, round, advanced: true });
      }
    }
  }

  if (matchResultNotifications.length > 0) {
    await notifyMatchResults(matchResultNotifications, tournament.name);
  }
  if (championNotification) {
    await notifyChampion(championNotification.email, championNotification.startupName, tournament.name);
  }

  if (stillPending.length > 0) {
    // Round not fully resolved yet (overtime or awaiting late votes) — cron will retry.
    return { roundComplete: false as const, pendingMatches: stillPending.length };
  }

  if (isFinalRound) {
    const finalMatch = await Match.findOne({ tournament: tournament._id, round });
    tournament.status = "completed";
    tournament.champion = finalMatch?.winner ?? undefined;
    tournament.activeLock = undefined;
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

  const nextRoundMatches = await Match.find({ tournament: tournament._id, round: nextRound }).populate<{
    startupA?: PopulatedStartup;
    startupB?: PopulatedStartup;
  }>([
    { path: "startupA", select: "name owner", populate: { path: "owner", select: "email" } },
    { path: "startupB", select: "name owner", populate: { path: "owner", select: "email" } },
  ]);
  const nextRoundEntrants = toRecipients(
    nextRoundMatches.flatMap((m) => [m.startupA, m.startupB].filter((s): s is PopulatedStartup => Boolean(s)))
  );
  if (nextRoundEntrants.length > 0) {
    await notifyRoundStarted(nextRoundEntrants, tournament.name, nextRound);
  }

  return { roundComplete: true as const, tournamentComplete: false as const, nextRound };
}
