/**
 * Tie-breaker rules for a 50/50 (votesA === votesB) result at match endsAt.
 *
 * Two strategies, chosen per-tournament via TieBreakConfig.mode:
 *  - "overtime": extend the match by `overtimeMinutes`, capped at `maxOvertimes`
 *    rounds of overtime. If still tied after the cap, falls back to early-vote
 *    priority so every match resolves deterministically.
 *  - "early_vote": whichever side received its first vote earlier wins outright,
 *    no overtime.
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

export interface TieBreakInput {
  votesA: number;
  votesB: number;
  firstVoteAAt: Date | null;
  firstVoteBAt: Date | null;
  overtimesUsed: number; // how many overtime periods already elapsed for this match
  now: Date;
}

export type TieBreakDecision =
  | { outcome: "winner"; side: "A" | "B"; reason: "votes" | "early_vote" }
  | { outcome: "overtime"; endsAt: Date }
  | { outcome: "no_votes_tie" }; // both sides at 0 votes and no tiebreak signal available

export function resolveTie(input: TieBreakInput, config: TieBreakConfig = DEFAULT_TIEBREAK_CONFIG): TieBreakDecision {
  if (input.votesA !== input.votesB) {
    return { outcome: "winner", side: input.votesA > input.votesB ? "A" : "B", reason: "votes" };
  }

  // True dead heat. Try early-vote priority first if that's the configured mode,
  // or if overtime has been exhausted.
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

  // Nobody voted at all — no signal to break the tie on.
  return { outcome: "no_votes_tie" };
}
