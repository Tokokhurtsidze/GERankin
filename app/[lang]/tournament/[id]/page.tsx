import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, Match } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveTournamentView } from "@/components/tournament/LiveTournamentView";
import { matchDocsToTreeMatches } from "@/lib/bracket/serialize";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";

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

  const initialMatches = matchDocsToTreeMatches(allMatches);

  const statusLabels: Record<string, string> = {
    registration: dict.tournament.statusRegistration,
    seeding: dict.tournament.statusSeeding,
    in_progress: dict.tournament.statusInProgress,
    completed: dict.tournament.statusCompleted,
    cancelled: dict.tournament.statusCancelled,
  };

  return (
    <LiveTournamentView
      tournamentId={tournament._id.toString()}
      tournamentName={tournament.name}
      locale={lang}
      initialTournament={{
        status: tournament.status,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds,
      }}
      initialMatches={initialMatches}
      dict={{
        round: dict.bracket.round,
        final: dict.bracket.final,
        roundLabel: dict.bracket.roundLabel,
        statusLabels,
        noLiveMatchesTitle: dict.tournament.noLiveMatchesTitle,
        noLiveMatchesBody: dict.tournament.noLiveMatchesBody,
      }}
    />
  );
}
