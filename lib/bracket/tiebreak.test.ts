import { describe, it, expect } from "vitest";
import { resolveTie, DEFAULT_TIEBREAK_CONFIG, type TieBreakInput } from "./tiebreak";

const now = new Date("2026-01-01T00:00:00Z");

function baseInput(overrides: Partial<TieBreakInput> = {}): TieBreakInput {
  return {
    votesA: 0,
    votesB: 0,
    firstVoteAAt: null,
    firstVoteBAt: null,
    overtimesUsed: 0,
    seedA: null,
    seedB: null,
    now,
    ...overrides,
  };
}

describe("resolveTie", () => {
  it("declares a winner outright when votes differ", () => {
    const result = resolveTie(baseInput({ votesA: 5, votesB: 3 }));
    expect(result).toEqual({ outcome: "winner", side: "A", reason: "votes" });
  });

  it("grants one grace overtime for a true 0-0 match", () => {
    const result = resolveTie(baseInput({ overtimesUsed: 0 }));
    expect(result.outcome).toBe("overtime");
  });

  it("falls back to the better seed after the 0-vote grace period is spent", () => {
    const result = resolveTie(baseInput({ overtimesUsed: 1, seedA: 2, seedB: 5 }));
    expect(result).toEqual({ outcome: "winner", side: "A", reason: "no_votes_seed" });
  });

  it("is a true no-vote tie when neither side has a seed to fall back on", () => {
    const result = resolveTie(baseInput({ overtimesUsed: 1 }));
    expect(result).toEqual({ outcome: "no_votes_tie" });
  });

  it("sends a real dead heat to overtime under the overtime strategy", () => {
    const result = resolveTie(baseInput({ votesA: 3, votesB: 3, overtimesUsed: 0 }));
    expect(result.outcome).toBe("overtime");
  });

  it("falls back to early-vote priority once overtime is exhausted", () => {
    const result = resolveTie(
      baseInput({
        votesA: 3,
        votesB: 3,
        overtimesUsed: DEFAULT_TIEBREAK_CONFIG.maxOvertimes,
        firstVoteAAt: new Date("2026-01-01T00:00:01Z"),
        firstVoteBAt: new Date("2026-01-01T00:00:02Z"),
      })
    );
    expect(result).toEqual({ outcome: "winner", side: "A", reason: "early_vote" });
  });

  it("resolves a real dead heat immediately under early_vote mode", () => {
    const result = resolveTie(
      baseInput({
        votesA: 4,
        votesB: 4,
        firstVoteAAt: new Date("2026-01-01T00:00:05Z"),
        firstVoteBAt: new Date("2026-01-01T00:00:01Z"),
      }),
      { mode: "early_vote", overtimeMinutes: 10, maxOvertimes: 2 }
    );
    expect(result).toEqual({ outcome: "winner", side: "B", reason: "early_vote" });
  });
});
