import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, Match } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";
import { RegistrationCountdown } from "@/components/tournament/RegistrationCountdown";
import { BracketTree } from "@/components/tournament/BracketTree";
import { BracketMobileList } from "@/components/tournament/BracketMobileList";
import { buildBracketTree, type TreeMatch, type TreeStartup } from "@/lib/bracket/tree";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";

interface PopulatedSide {
  _id: unknown;
  name: string;
  logoUrl: string;
}

function toTreeSide(raw: unknown): TreeStartup | undefined {
  const side = raw as PopulatedSide | undefined;
  if (!side?.name) return undefined;
  return {
    id: String(side._id),
    name: side.name,
    logoUrl: side.logoUrl,
  };
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  try {
    await dbConnect();
  } catch {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <EmptyState title="Database not connected" message={dict.tournament.dbNotConnectedBody} />
      </section>
    );
  }

  const tournament = await Tournament.findById(id).lean();
  if (!tournament) notFound();

  const populateOpts = [
    { path: "startupA", select: "name logoUrl" },
    { path: "startupB", select: "name logoUrl" },
  ];

  const allMatches = await Match.find({ tournament: id })
    .populate(populateOpts)
    .sort({ round: 1, slot: 1 })
    .lean();

  const toTreeMatch = (m: (typeof allMatches)[number]): TreeMatch => ({
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
  });

  const treeMatches = allMatches.map(toTreeMatch);
  const tree = buildBracketTree(treeMatches, tournament.totalRounds);

  const currentRoundEndsAt = allMatches.find((m) => m.round === tournament.currentRound)?.endsAt;

  const statusLabels: Record<string, string> = {
    registration: dict.tournament.statusRegistration,
    seeding: dict.tournament.statusSeeding,
    in_progress: dict.tournament.statusInProgress,
    completed: dict.tournament.statusCompleted,
    cancelled: dict.tournament.statusCancelled,
  };

  const isLive = tournament.status === "in_progress";
  const isFinalRound = tournament.currentRound === tournament.totalRounds;

  // dict.bracket.roundLabel already ends with the same word as dict.bracket.round
  // ("BRACKET · ROUND" / "Round", "ბრეკეტი · რაუნდი" / "რაუნდი") — strip that
  // trailing word to get a reusable "BRACKET · " prefix for the final-round label.
  const roundLabel = dict.bracket.roundLabel;
  const roundWord = dict.bracket.round;
  const roundLabelPrefix = roundLabel.toLowerCase().endsWith(roundWord.toLowerCase())
    ? roundLabel.slice(0, roundLabel.length - roundWord.length)
    : `${roundLabel} `;

  const headerTitle = isLive
    ? isFinalRound
      ? `${roundLabelPrefix}${dict.bracket.final}`
      : `${roundLabel} ${tournament.currentRound}`
    : tournament.name;

  const tournamentId = tournament._id.toString();

  return (
    <section className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl flex-col overflow-hidden px-4 py-6 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-wide text-accent">{headerTitle}</h1>
        </div>

        {isLive && currentRoundEndsAt ? (
          <RegistrationCountdown closesAt={currentRoundEndsAt.toISOString()} closingLabel={dict.registration.closing} />
        ) : (
          <span className="font-mono-score ink-border rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {statusLabels[tournament.status] ?? tournament.status}
          </span>
        )}
      </div>

      {treeMatches.length === 0 ? (
        <EmptyState title={dict.tournament.noLiveMatchesTitle} message={dict.tournament.noLiveMatchesBody} />
      ) : (
        <div className="min-h-0 flex-1">
          <BracketTree
            tree={tree}
            locale={lang}
            tournamentId={tournamentId}
            dict={{ round: dict.bracket.round, final: dict.bracket.final }}
          />
          <div className="h-full overflow-y-auto lg:hidden">
            <BracketMobileList
              tree={tree}
              locale={lang}
              tournamentId={tournamentId}
              dict={{ round: dict.bracket.round, final: dict.bracket.final }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
