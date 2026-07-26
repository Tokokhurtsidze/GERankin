import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, Match, Startup } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchCard, type MatchCardData, type MatchCardSide } from "@/components/tournament/MatchCard";
import { EndedRoundsAccordion, type EndedRound } from "@/components/tournament/EndedRoundsAccordion";
import { StartupRailCard } from "@/components/tournament/StartupRailCard";
import { RegistrationCountdown } from "@/components/tournament/RegistrationCountdown";

interface PopulatedSide {
  _id: unknown;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  owner?: { name?: string };
}

function toSide(raw: unknown): MatchCardSide | undefined {
  const side = raw as PopulatedSide | undefined;
  if (!side?.name) return undefined;
  return {
    id: String(side._id),
    name: side.name,
    logoUrl: side.logoUrl,
    websiteUrl: side.websiteUrl,
    ownerName: side.owner?.name,
  };
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;

  try {
    await dbConnect();
  } catch {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load this tournament." />
      </section>
    );
  }

  const tournament = await Tournament.findById(id).lean();
  if (!tournament) notFound();

  const populateOpts = [
    { path: "startupA", select: "name logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
    { path: "startupB", select: "name logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
  ];

  const allMatches = await Match.find({ tournament: id })
    .populate(populateOpts)
    .sort({ round: 1, slot: 1 })
    .lean();

  const toCardData = (m: (typeof allMatches)[number]): MatchCardData => ({
    id: m._id.toString(),
    startupA: toSide(m.startupA),
    startupB: toSide(m.startupB),
    votesA: m.votesA,
    votesB: m.votesB,
    status: m.status,
    winner: m.winner?.toString(),
  });

  const currentRoundDocs = allMatches.filter((m) => m.round === tournament.currentRound);
  const currentRoundMatches = currentRoundDocs.map(toCardData);
  const currentRoundEndsAt = currentRoundDocs[0]?.endsAt;

  const endedRounds: EndedRound[] = Array.from({ length: Math.max(0, tournament.currentRound - 1) }, (_, i) => {
    const round = i + 1;
    const matches = allMatches.filter((m) => m.round === round);
    const endedAt = matches.reduce<Date>((latest, m) => (m.updatedAt > latest ? m.updatedAt : latest), matches[0]?.updatedAt ?? tournament.updatedAt);
    return { round, endedAt: endedAt.toISOString(), matches: matches.map(toCardData) };
  }).reverse();

  const inCurrentMatch = new Set(
    currentRoundMatches.flatMap((m) => [m.startupA?.id, m.startupB?.id].filter(Boolean) as string[])
  );
  const railStartups = await Startup.find({
    tournament: id,
    _id: { $nin: [...inCurrentMatch] },
    eliminated: false,
  })
    .select("name tagline logoUrl")
    .limit(4)
    .lean();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-lg font-semibold">{tournament.name}</p>
        {tournament.status === "in_progress" && (
          <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <h1 className="text-sm font-semibold uppercase tracking-wide text-accent">
              Round {tournament.currentRound}
            </h1>
            {currentRoundEndsAt && <RegistrationCountdown closesAt={currentRoundEndsAt.toISOString()} />}
          </div>
        )}
        {tournament.status !== "in_progress" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {tournament.status}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_220px]">
        <aside className="hidden flex-col gap-4 lg:flex">
          {railStartups.slice(0, 2).map((s) => (
            <StartupRailCard
              key={s._id.toString()}
              locale={lang}
              id={s._id.toString()}
              name={s.name}
              tagline={s.tagline}
              logoUrl={s.logoUrl}
            />
          ))}
        </aside>

        <div className="flex flex-col gap-6">
          {currentRoundMatches.length === 0 && (
            <EmptyState title="No live matches" message="This round hasn't been seeded yet — check back shortly." />
          )}
          {currentRoundMatches.map((m) => (
            <MatchCard key={m.id} match={m} locale={lang} interactive={tournament.status === "in_progress"} />
          ))}
        </div>

        <aside className="hidden flex-col gap-4 lg:flex">
          {railStartups.slice(2, 4).map((s) => (
            <StartupRailCard
              key={s._id.toString()}
              locale={lang}
              id={s._id.toString()}
              name={s.name}
              tagline={s.tagline}
              logoUrl={s.logoUrl}
            />
          ))}
        </aside>
      </div>

      <EndedRoundsAccordion rounds={endedRounds} locale={lang} label="Ended rounds" matchesLabel="matches" />
    </section>
  );
}
