import Link from "next/link";
import { dbConnect } from "@/lib/db/connect";
import { Match, type ITournament } from "@/lib/db/models";
import { MatchCard, type MatchCardData, type MatchCardSide } from "./MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";

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

export async function LiveBracketSection({ tournament, locale }: { tournament: ITournament | null; locale: string }) {
  if (!tournament || tournament.status !== "in_progress") {
    return <EmptyState title="No live bracket right now" message="Matches will appear here once a tournament kicks off." />;
  }

  let currentRoundMatches: MatchCardData[] = [];
  try {
    await dbConnect();
    const docs = await Match.find({ tournament: tournament._id, round: tournament.currentRound })
      .populate([
        { path: "startupA", select: "name logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
        { path: "startupB", select: "name logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
      ])
      .lean();
    currentRoundMatches = docs.map((m) => ({
      id: m._id.toString(),
      startupA: toSide(m.startupA),
      startupB: toSide(m.startupB),
      votesA: m.votesA,
      votesB: m.votesB,
      status: m.status,
      winner: m.winner?.toString(),
    }));
  } catch {
    return <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load the bracket." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm font-semibold text-text-muted">Round {tournament.currentRound}</p>
      {currentRoundMatches.map((m) => (
        <MatchCard key={m.id} match={m} locale={locale} tournamentId={tournament._id.toString()} interactive />
      ))}
      <Link
        href={`/${locale}/tournament/${tournament._id.toString()}`}
        className="mx-auto text-sm font-semibold text-accent hover:underline"
      >
        View full bracket →
      </Link>
    </div>
  );
}
