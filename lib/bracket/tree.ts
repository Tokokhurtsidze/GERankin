/**
 * Splits a tournament's full match list into a mirrored tree: two symmetric
 * halves (left/right) converging on a single centered final. Uses each
 * match's persisted `nextMatch` reference for connector-line lookups rather
 * than recomputing bracket geometry — no dependency on ./generate.ts.
 *
 * Pure, no DB/Mongoose coupling — same style as ./generate.ts and ./tiebreak.ts.
 */

export interface TreeStartup {
  id: string;
  name: string;
  logoUrl: string;
}

export interface TreeMatch {
  id: string;
  round: number; // 1-indexed, matches Match.round
  slot: number; // 0-indexed within its round, matches Match.slot
  nextMatchId: string | null;
  startupA?: TreeStartup;
  startupB?: TreeStartup;
  votesA: number;
  votesB: number;
  status: string; // "live" | "overtime" | "pending" | "bye" | "completed"
  winnerId: string | null;
  // null (not the raw new Date(0) placeholder pending matches carry) when not
  // applicable — see lib/bracket/serialize.ts for the epoch->null conversion.
  startsAt: string | null;
  endsAt: string | null;
  overtimeEndsAt: string | null;
}

export interface BracketTree {
  totalRounds: number;
  /** leftColumns[0] = round 1 (outermost, most matches) ... leftColumns[totalRounds-2] = semifinal */
  leftColumns: TreeMatch[][];
  /** Same round semantics as leftColumns, mirrored: index 0 is still round 1 but rendered on the right edge */
  rightColumns: TreeMatch[][];
  final: TreeMatch | null;
}

/**
 * `totalRounds` matches Tournament.totalRounds (log2(bracketSize)). A
 * `totalRounds` of 1 means the tournament is just a single final — both
 * column arrays come back empty, `final` is that one match. This is the
 * correct, non-special-cased degenerate case: a bracketSize-2 tournament
 * has no earlier rounds to mirror.
 */
export function buildBracketTree(matches: TreeMatch[], totalRounds: number): BracketTree {
  const leftColumns: TreeMatch[][] = [];
  const rightColumns: TreeMatch[][] = [];
  let final: TreeMatch | null = null;

  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = matches.filter((m) => m.round === round).sort((a, b) => a.slot - b.slot);

    if (round === totalRounds) {
      final = roundMatches[0] ?? null;
      continue;
    }

    const half = roundMatches.length / 2;
    leftColumns.push(roundMatches.filter((m) => m.slot < half));
    // Mirrored for rendering: reversed so the visual order flows outward
    // from the center on the right side, matching the left side's flow.
    rightColumns.push(roundMatches.filter((m) => m.slot >= half).reverse());
  }

  return { totalRounds, leftColumns, rightColumns, final };
}
