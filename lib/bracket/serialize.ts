import type { TreeMatch, TreeStartup } from "./tree";

interface PopulatedSide {
  _id: unknown;
  name: string;
  logoUrl: string;
}

function toTreeSide(raw: unknown): TreeStartup | undefined {
  const side = raw as PopulatedSide | undefined;
  if (!side?.name) return undefined;
  return { id: String(side._id), name: side.name, logoUrl: side.logoUrl };
}

/** Structural shape shared by both the page's `.lean()` query and the API
 *  route's — matches how each field is actually used, not the full Mongoose type. */
export interface MatchLike {
  _id: { toString(): string };
  round: number;
  slot: number;
  nextMatch?: { toString(): string } | null;
  startupA?: unknown;
  startupB?: unknown;
  votesA: number;
  votesB: number;
  status: string;
  winner?: { toString(): string } | null;
  startsAt: Date;
  endsAt: Date;
  overtimeEndsAt?: Date | null;
}

/**
 * Shared by the tournament page (Server Component) and the /api/tournament/[id]/matches
 * route so both produce identical TreeMatch shapes. Pending matches' startsAt/endsAt are
 * a `new Date(0)` epoch placeholder upstream (lib/bracket/persist.ts) until their round
 * opens — converted to null here so no consumer ever mistakes it for a real timestamp.
 */
export function matchDocsToTreeMatches(docs: MatchLike[]): TreeMatch[] {
  return docs.map((m) => {
    const isPending = m.status === "pending";
    return {
      id: m._id.toString(),
      round: m.round,
      slot: m.slot,
      nextMatchId: m.nextMatch ? m.nextMatch.toString() : null,
      startupA: toTreeSide(m.startupA),
      startupB: toTreeSide(m.startupB),
      votesA: m.votesA,
      votesB: m.votesB,
      status: m.status,
      winnerId: m.winner ? m.winner.toString() : null,
      startsAt: isPending ? null : m.startsAt.toISOString(),
      endsAt: isPending ? null : m.endsAt.toISOString(),
      overtimeEndsAt: m.overtimeEndsAt ? m.overtimeEndsAt.toISOString() : null,
    };
  });
}
