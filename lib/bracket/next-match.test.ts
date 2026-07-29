import { describe, it, expect } from "vitest";
import { pickNextMatch, type MatchSlotRef } from "./next-match";

const siblings: MatchSlotRef[] = [
  { id: "match-0", slot: 0 },
  { id: "match-1", slot: 1 },
  { id: "match-2", slot: 2 },
];

describe("pickNextMatch", () => {
  it("returns the lowest-slot match not yet voted in", () => {
    expect(pickNextMatch(siblings, ["match-0"])).toBe("match-1");
  });

  it("ignores voted-id order and always returns by ascending slot", () => {
    expect(pickNextMatch(siblings, ["match-1", "match-0"])).toBe("match-2");
  });

  it("returns null when every sibling is voted", () => {
    expect(pickNextMatch(siblings, ["match-0", "match-1", "match-2"])).toBeNull();
  });

  it("returns the lowest-slot match when none are voted", () => {
    expect(pickNextMatch(siblings, [])).toBe("match-0");
  });

  it("returns null when there are no siblings at all", () => {
    expect(pickNextMatch([], [])).toBeNull();
  });

  it("does not mutate the input siblings array order", () => {
    const unsorted: MatchSlotRef[] = [
      { id: "match-2", slot: 2 },
      { id: "match-0", slot: 0 },
      { id: "match-1", slot: 1 },
    ];
    expect(pickNextMatch(unsorted, ["match-0"])).toBe("match-1");
    expect(unsorted.map((m) => m.id)).toEqual(["match-2", "match-0", "match-1"]);
  });
});
