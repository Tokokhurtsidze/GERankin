import { describe, it, expect } from "vitest";
import { calculateBracketSize, getSeedOrder, generateBracket, getNextSlot, BracketError, type Entrant } from "./generate";

describe("calculateBracketSize", () => {
  it("rounds up to the next power of 2", () => {
    expect(calculateBracketSize(2)).toBe(2);
    expect(calculateBracketSize(3)).toBe(4);
    expect(calculateBracketSize(5)).toBe(8);
    expect(calculateBracketSize(9)).toBe(16);
    expect(calculateBracketSize(32)).toBe(32);
  });

  it("throws below the minimum or above the maximum", () => {
    expect(() => calculateBracketSize(1)).toThrow(BracketError);
    expect(() => calculateBracketSize(33)).toThrow(BracketError);
  });
});

describe("getSeedOrder", () => {
  it("produces the standard tournament seed order", () => {
    expect(getSeedOrder(2)).toEqual([1, 2]);
    expect(getSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(getSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("throws for a non-power-of-2 size", () => {
    expect(() => getSeedOrder(6)).toThrow(BracketError);
  });
});

describe("generateBracket", () => {
  function entrants(count: number): Entrant[] {
    return Array.from({ length: count }, (_, i) => ({ id: `s${i + 1}`, seed: i + 1 }));
  }

  it("pairs every entrant in round 1 with no byes when count is a power of 2", () => {
    const bracket = generateBracket(entrants(4));
    expect(bracket.bracketSize).toBe(4);
    expect(bracket.totalRounds).toBe(2);
    expect(bracket.rounds[0].every((m) => !m.isBye)).toBe(true);
    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[1]).toHaveLength(1);
  });

  it("gives byes to the top seeds when count isn't a power of 2", () => {
    const bracket = generateBracket(entrants(5));
    expect(bracket.bracketSize).toBe(8);
    const byeMatches = bracket.rounds[0].filter((m) => m.isBye);
    // 8 - 5 = 3 byes
    expect(byeMatches).toHaveLength(3);
    for (const m of byeMatches) {
      expect(m.byeWinner).not.toBeNull();
    }
  });

  it("never pairs the top two seeds against each other in round 1", () => {
    const bracket = generateBracket(entrants(8));
    const seed1Match = bracket.rounds[0].find(
      (m) => m.entrantA?.seed === 1 || m.entrantB?.seed === 1
    );
    expect(seed1Match?.entrantA?.seed === 2 || seed1Match?.entrantB?.seed === 2).toBe(false);
  });
});

describe("getNextSlot", () => {
  it("maps round 1 slots into round 2 sides correctly", () => {
    expect(getNextSlot(1, 0)).toEqual({ round: 2, slot: 0, side: "A" });
    expect(getNextSlot(1, 1)).toEqual({ round: 2, slot: 0, side: "B" });
    expect(getNextSlot(1, 2)).toEqual({ round: 2, slot: 1, side: "A" });
    expect(getNextSlot(1, 3)).toEqual({ round: 2, slot: 1, side: "B" });
  });
});
