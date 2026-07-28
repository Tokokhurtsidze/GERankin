/**
 * Tie-breaker rules for a 50/50 (votesA === votesB) result at match endsAt.
 *
 * Two strategies, chosen per-tournament via TieBreakConfig.mode:
 *  - "overtime": extend the match by `overtimeMinutes`, capped at `maxOvertimes`
 *    rounds of overtime. If still tied after the cap, falls back to early-vote
 *    priority so every match resolves deterministically.
 *  - "early_vote": whichever side received its first vote earlier wins outright,
 *    no overtime.
 *
 * A match with zero votes on both sides gets exactly one grace overtime
 * period (regardless of `maxOvertimes`, which governs *real* dead heats) —
 * if it's still 0-0 after that, the better seed advances. Without this, a
 * match nobody notices stalls the whole tournament forever.
 */

export interface TieBreakConfig {
  mode: "overtime" | "early_vote";
  overtimeMinutes: number; // duration of each overtime period
  maxOvertimes: number; // safety cap before forcing early-vote resolution
}

export const DEFAULT_TIEBREAK_CONFIG: TieBreakConfig = {
  mode: "overtime",
  overtimeMinutes: 10,
  maxOvertimes: 2,
};

const NO_VOTE_GRACE_OVERTIMES = 1;

export interface TieBreakInput {
  votesA: number;
  votesB: number;
  firstVoteAAt: Date | null;
  firstVoteBAt: Date | null;
  overtimesUsed: number; // how many overtime periods already elapsed for this match
  seedA: number | null; // lower seed = better; used only to force a 0-vote match to a result
  seedB: number | null;
  now: Date;
}

export type TieBreakDecision =
  | { outcome: "winner"; side: "A" | "B"; reason: "votes" | "early_vote" | "no_votes_seed" }
  | { outcome: "overtime"; endsAt: Date }
  | { outcome: "no_votes_tie" }; // both sides at 0 votes and no seed to fall back on either

export function resolveTie(input: TieBreakInput, config: TieBreakConfig = DEFAULT_TIEBREAK_CONFIG): TieBreakDecision {
  if (input.votesA !== input.votesB) {
    return { outcome: "winner", side: input.votesA > input.votesB ? "A" : "B", reason: "votes" };
  }

  const trueNoVoteCase = input.votesA === 0 && input.votesB === 0;

  if (trueNoVoteCase) {
    if (input.overtimesUsed < NO_VOTE_GRACE_OVERTIMES) {
      return { outcome: "overtime", endsAt: new Date(input.now.getTime() + config.overtimeMinutes * 60_000) };
    }
    if (input.seedA != null && input.seedB != null && input.seedA !== input.seedB) {
      return { outcome: "winner", side: input.seedA < input.seedB ? "A" : "B", reason: "no_votes_seed" };
    }
    return { outcome: "no_votes_tie" };
  }

  // True dead heat with real (equal) votes on both sides. Try early-vote
  // priority first if that's the configured mode, or if overtime is exhausted.
  const overtimeExhausted = input.overtimesUsed >= config.maxOvertimes;

  if (config.mode === "overtime" && !overtimeExhausted) {
    return { outcome: "overtime", endsAt: new Date(input.now.getTime() + config.overtimeMinutes * 60_000) };
  }

  // early_vote mode, or overtime cap reached: whoever got a vote first wins.
  if (input.firstVoteAAt && input.firstVoteBAt) {
    return {
      outcome: "winner",
      side: input.firstVoteAAt.getTime() <= input.firstVoteBAt.getTime() ? "A" : "B",
      reason: "early_vote",
    };
  }
  if (input.firstVoteAAt) return { outcome: "winner", side: "A", reason: "early_vote" };
  if (input.firstVoteBAt) return { outcome: "winner", side: "B", reason: "early_vote" };

  // Real votes exist (equal count) but no first-vote timestamp signal either — shouldn't
  // happen in practice (a vote always sets one), but resolve deterministically anyway.
  return { outcome: "no_votes_tie" };
}
