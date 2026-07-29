export interface MatchSlotRef {
  id: string;
  slot: number;
}

// Picks the lowest-slot sibling match this voter hasn't voted in yet, or null
// if they've voted in all of them (or there are none). Never mutates `siblings`.
export function pickNextMatch(
  siblings: MatchSlotRef[],
  votedMatchIds: Iterable<string>
): string | null {
  const voted = new Set(votedMatchIds);
  const sorted = [...siblings].sort((a, b) => a.slot - b.slot);
  const next = sorted.find((m) => !voted.has(m.id));
  return next ? next.id : null;
}
