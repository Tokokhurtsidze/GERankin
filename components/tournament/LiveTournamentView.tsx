"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { EmptyState } from "@/components/ui/EmptyState";
import { BracketTree } from "./BracketTree";
import { BracketMobileList } from "./BracketMobileList";
import { MatchTimer } from "./MatchTimer";
import { buildBracketTree, type TreeMatch } from "@/lib/bracket/tree";
import { fetcher } from "@/lib/api/fetcher";

interface TournamentSnapshot {
  status: string;
  currentRound: number;
  totalRounds: number;
}

export function LiveTournamentView({
  tournamentId,
  tournamentName,
  locale,
  initialTournament,
  initialMatches,
  dict,
}: {
  tournamentId: string;
  tournamentName: string;
  locale: string;
  initialTournament: TournamentSnapshot;
  initialMatches: TreeMatch[];
  dict: {
    round: string;
    final: string;
    roundLabel: string;
    statusLabels: Record<string, string>;
    noLiveMatchesTitle: string;
    noLiveMatchesBody: string;
  };
}) {
  const { data } = useSWR<{ tournament: TournamentSnapshot; matches: TreeMatch[] }>(
    `/api/tournament/${tournamentId}/matches`,
    fetcher,
    { refreshInterval: 4000, fallbackData: { tournament: initialTournament, matches: initialMatches } }
  );

  const tournament = data?.tournament ?? initialTournament;
  const matches = data?.matches ?? initialMatches;

  const tree = useMemo(() => buildBracketTree(matches, tournament.totalRounds), [matches, tournament.totalRounds]);

  // All in-progress matches share the same round deadline, so one timer above
  // the whole tree (instead of one per match card) is enough and avoids
  // repeating the same countdown value across every live pair.
  const liveMatch = matches.find((m) => m.status === "live" || m.status === "overtime");

  const isLive = tournament.status === "in_progress";
  const isFinalRound = tournament.currentRound === tournament.totalRounds;

  // dict.roundLabel already ends with the same word as dict.round ("BRACKET · ROUND" /
  // "Round") — strip that trailing word to get a reusable "BRACKET · " prefix for the
  // final-round label.
  const roundLabelPrefix = dict.roundLabel.toLowerCase().endsWith(dict.round.toLowerCase())
    ? dict.roundLabel.slice(0, dict.roundLabel.length - dict.round.length)
    : `${dict.roundLabel} `;

  const headerTitle = isLive
    ? isFinalRound
      ? `${roundLabelPrefix}${dict.final}`
      : `${dict.round} ${tournament.currentRound}`
    : tournamentName;

  return (
    <section className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl flex-col overflow-hidden px-4 py-6 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-3">
        {liveMatch && (
          <MatchTimer status={liveMatch.status} endsAt={liveMatch.endsAt} overtimeEndsAt={liveMatch.overtimeEndsAt} size="lg" />
        )}
        <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h1 className="text-sm font-semibold uppercase tracking-wide text-accent">{headerTitle}</h1>

          <span className="font-mono-score ink-border rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {dict.statusLabels[tournament.status] ?? tournament.status}
          </span>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState title={dict.noLiveMatchesTitle} message={dict.noLiveMatchesBody} />
      ) : (
        <div className="min-h-0 flex-1">
          <BracketTree
            tree={tree}
            locale={locale}
            tournamentId={tournamentId}
            dict={{ round: dict.round, final: dict.final }}
          />
          <div className="h-full overflow-y-auto lg:hidden">
            <BracketMobileList
              tree={tree}
              locale={locale}
              tournamentId={tournamentId}
              dict={{ round: dict.round, final: dict.final }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
