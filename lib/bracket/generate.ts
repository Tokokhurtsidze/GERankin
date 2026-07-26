/**
 * Dynamic single-elimination bracket generation.
 *
 * Handles 2-32 entrants. When the entrant count isn't an exact power of 2,
 * the bracket is rounded up to the next power of 2 and the top seeds receive
 * byes (an automatic walkover into round 2) — standard tournament seeding,
 * same approach used by NCAA-style brackets.
 *
 * Pure functions, no DB/Mongoose coupling, so they're unit-testable in isolation.
 */

export const MIN_ENTRANTS = 2;
export const MAX_ENTRANTS = 32;
export const VALID_BRACKET_SIZES = [2, 4, 8, 16, 32] as const;

export interface Entrant {
  id: string; // Startup _id as string
  seed: number; // 1-indexed, lower = higher priority (e.g. earliest registrant)
}

export interface BracketMatchSlot {
  round: number; // 1-indexed
  slot: number; // 0-indexed position within the round
  entrantA: Entrant | null; // null = bye
  entrantB: Entrant | null; // null = bye
  isBye: boolean; // true if exactly one side is null (auto-advance, no vote needed)
  byeWinner: Entrant | null; // set when isBye is true
}

export interface GeneratedBracket {
  bracketSize: number; // next power of 2 >= entrant count, clamped to [2, 32]
  totalRounds: number; // log2(bracketSize)
  rounds: BracketMatchSlot[][]; // rounds[0] = round 1, only round 1 is pre-populated with entrants
}

export class BracketError extends Error {}

/** Rounds up to the nearest power of 2 within [MIN_ENTRANTS, MAX_ENTRANTS]. */
export function calculateBracketSize(entrantCount: number): number {
  if (entrantCount < MIN_ENTRANTS) {
    throw new BracketError(`Need at least ${MIN_ENTRANTS} entrants to start a tournament, got ${entrantCount}`);
  }
  if (entrantCount > MAX_ENTRANTS) {
    throw new BracketError(`Tournament capacity exceeded: max ${MAX_ENTRANTS} entrants, got ${entrantCount}`);
  }
  let size = 2;
  while (size < entrantCount) size *= 2;
  return size;
}

/**
 * Standard recursive tournament seed order, e.g. bracketSize=8 -> [1,8,4,5,2,7,3,6].
 * This is the order seeds are laid out left-to-right across round 1 so that
 * top seeds can only meet in later rounds (never in round 1).
 */
export function getSeedOrder(bracketSize: number): number[] {
  if ((bracketSize & (bracketSize - 1)) !== 0) {
    throw new BracketError(`bracketSize must be a power of 2, got ${bracketSize}`);
  }
  let order = [1];
  while (order.length < bracketSize) {
    const len = order.length * 2;
    const next: number[] = [];
    for (const s of order) {
      next.push(s, len + 1 - s);
    }
    order = next;
  }
  return order;
}

/**
 * Builds the full bracket skeleton: round 1 populated with seeded entrants
 * (byes resolved), later rounds pre-created as empty TBD slots.
 *
 * Entrants should be pre-sorted by seed ascending (seed 1 = highest priority,
 * e.g. first to register) before calling this.
 */
export function generateBracket(entrants: Entrant[]): GeneratedBracket {
  const entrantCount = entrants.length;
  const bracketSize = calculateBracketSize(entrantCount);
  const totalRounds = Math.log2(bracketSize);

  const seedOrder = getSeedOrder(bracketSize);
  const bySeed = new Map<number, Entrant>();
  for (const e of entrants) bySeed.set(e.seed, e);

  // Positions beyond entrantCount are byes (empty slots).
  const positioned: (Entrant | null)[] = seedOrder.map((seed) => bySeed.get(seed) ?? null);

  const round1: BracketMatchSlot[] = [];
  for (let slot = 0; slot < bracketSize / 2; slot++) {
    const entrantA = positioned[slot * 2];
    const entrantB = positioned[slot * 2 + 1];
    const isBye = (entrantA === null) !== (entrantB === null); // exactly one side missing
    round1.push({
      round: 1,
      slot,
      entrantA,
      entrantB,
      isBye,
      byeWinner: isBye ? (entrantA ?? entrantB) : null,
    });
  }

  const rounds: BracketMatchSlot[][] = [round1];
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r);
    const emptyRound: BracketMatchSlot[] = Array.from({ length: matchesInRound }, (_, slot) => ({
      round: r,
      slot,
      entrantA: null,
      entrantB: null,
      isBye: false,
      byeWinner: null,
    }));
    rounds.push(emptyRound);
  }

  return { bracketSize, totalRounds, rounds };
}

/**
 * Given a winner advancing from round `round` slot `slot`, returns the
 * {round, slot, side} of the next match they should be placed into.
 * side 'A' if they land on the even sub-slot, 'B' if odd.
 */
export function getNextSlot(round: number, slot: number): { round: number; slot: number; side: "A" | "B" } {
  return {
    round: round + 1,
    slot: Math.floor(slot / 2),
    side: slot % 2 === 0 ? "A" : "B",
  };
}
