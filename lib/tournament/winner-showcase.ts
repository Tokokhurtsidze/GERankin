export interface WinnerStartup {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
}

/** Splits an ordered winners list into two display columns: even indices
 *  (most-recent-first order) go left, odd go right, so a single winner
 *  lands on the left and an odd total leaves the left column one ahead. */
export function splitWinnerColumns(winners: WinnerStartup[]): {
  left: WinnerStartup[];
  right: WinnerStartup[];
} {
  const left: WinnerStartup[] = [];
  const right: WinnerStartup[] = [];
  winners.forEach((winner, index) => {
    (index % 2 === 0 ? left : right).push(winner);
  });
  return { left, right };
}
