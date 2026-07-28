import Link from "next/link";
import type { BracketTree as BracketTreeData, TreeMatch } from "@/lib/bracket/tree";
import { BracketSlot } from "./BracketSlot";
import { MatchTimer } from "./MatchTimer";

export interface BracketMobileListProps {
  tree: BracketTreeData;
  locale: string;
  tournamentId: string;
  dict: { round: string; final: string };
}

/**
 * One TreeMatch rendered as its vertically-stacked pair of competitor slots
 * (side A above side B). No connector lines here — this is the simplified
 * mobile list, not the desktop tree.
 */
function MatchPair({
  match,
  locale,
  tournamentId,
}: {
  match: TreeMatch;
  locale: string;
  tournamentId: string;
}) {
  const sides = [
    { startup: match.startupA, votes: match.votesA },
    { startup: match.startupB, votes: match.votesB },
  ];

  const rows = sides.map(({ startup, votes }, i) => {
    const isWinner = match.status === "completed" && !!startup && match.winnerId === startup.id;
    const isLoser =
      match.status === "completed" && !!startup && match.winnerId !== null && match.winnerId !== startup.id;

    return (
      <div key={i} className="flex items-center gap-2">
        <BracketSlot
          startup={startup}
          matchId={match.id}
          locale={locale}
          tournamentId={tournamentId}
          status={match.status}
          isWinner={isWinner}
          isLoser={isLoser}
          votes={votes}
          asLink={false}
        />
        <span
          className={[
            "truncate text-sm",
            isLoser ? "text-text-muted" : "text-text",
            isWinner ? "font-semibold" : "",
          ].join(" ")}
        >
          {startup?.name ?? "TBD"}
        </span>
      </div>
    );
  });

  const isLiveMatch = match.status === "live" || match.status === "overtime";
  const timer = isLiveMatch && (
    <div className="flex justify-end">
      <MatchTimer status={match.status} endsAt={match.endsAt} overtimeEndsAt={match.overtimeEndsAt} />
    </div>
  );

  // Both sides link to the same match — make the whole card one tap target
  // instead of just the small avatar icon (too easy to miss, especially on
  // touch/tablet).
  if (match.startupA && match.startupB) {
    return (
      <Link
        href={`/${locale}/tournament/${tournamentId}/match/${match.id}`}
        className="ink-border flex flex-col gap-1 rounded-md bg-surface p-1.5 transition-colors hover:bg-bg"
      >
        {timer}
        {rows}
      </Link>
    );
  }

  return (
    <div className="ink-border flex flex-col gap-1 rounded-md bg-surface p-1.5">
      {timer}
      {rows}
    </div>
  );
}

/**
 * Mobile fallback for the bracket tree: a single vertical scrollable column,
 * grouped by actual round number (left/right halves of that round combined),
 * followed by the final. Hidden at `lg` and above — the desktop BracketTree
 * takes over there.
 */
export function BracketMobileList({ tree, locale, tournamentId, dict }: BracketMobileListProps) {
  const roundCount = Math.max(tree.totalRounds - 1, 0);
  const rounds = Array.from({ length: roundCount }, (_, i) => {
    const left = tree.leftColumns[i] ?? [];
    const right = tree.rightColumns[i] ?? [];
    return { roundNumber: i + 1, matches: [...left, ...right] };
  });

  return (
    <div className="flex flex-col gap-6 lg:hidden">
      {rounds.map(({ roundNumber, matches }) => (
        <section key={roundNumber} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {dict.round} {roundNumber}
          </h2>
          <div className="flex flex-col gap-2">
            {matches.map((match) => (
              <MatchPair key={match.id} match={match} locale={locale} tournamentId={tournamentId} />
            ))}
          </div>
        </section>
      ))}

      {tree.final && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.final}</h2>
          <MatchPair match={tree.final} locale={locale} tournamentId={tournamentId} />
        </section>
      )}
    </div>
  );
}
