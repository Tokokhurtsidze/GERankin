import { describe, it, expect } from "vitest";
import { buildBracketTree, type TreeMatch } from "./tree";

function match(round: number, slot: number): TreeMatch {
  return {
    id: `r${round}s${slot}`,
    round,
    slot,
    nextMatchId: null,
    votesA: 0,
    votesB: 0,
    status: "pending",
    winnerId: null,
    startsAt: null,
    endsAt: null,
    overtimeEndsAt: null,
  };
}

describe("buildBracketTree", () => {
  it("treats a 2-entrant bracket as a single final with no side columns", () => {
    const tree = buildBracketTree([match(1, 0)], 1);
    expect(tree.leftColumns).toEqual([]);
    expect(tree.rightColumns).toEqual([]);
    expect(tree.final?.id).toBe("r1s0");
  });

  it("splits an 8-entrant bracket into mirrored left/right halves plus a final", () => {
    const matches: TreeMatch[] = [
      match(1, 0),
      match(1, 1),
      match(1, 2),
      match(1, 3),
      match(2, 0),
      match(2, 1),
      match(3, 0),
    ];
    const tree = buildBracketTree(matches, 3);

    expect(tree.final?.id).toBe("r3s0");
    // Round 1 (index 0) splits its 4 matches 2/2 between left and right.
    expect(tree.leftColumns[0]).toHaveLength(2);
    expect(tree.rightColumns[0]).toHaveLength(2);
    expect(tree.leftColumns[0].map((m) => m.id)).toEqual(["r1s0", "r1s1"]);
    // Right side is reversed for mirrored rendering.
    expect(tree.rightColumns[0].map((m) => m.id)).toEqual(["r1s3", "r1s2"]);
    // Semifinal (round 2) splits 1/1.
    expect(tree.leftColumns[1]).toHaveLength(1);
    expect(tree.rightColumns[1]).toHaveLength(1);
  });
});
