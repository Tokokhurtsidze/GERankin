import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db/connect";
import { Match } from "@/lib/db/models";
import { LiveWebsitePreview } from "@/components/tournament/LiveWebsitePreview";
import { OutboundLink } from "@/components/tournament/OutboundLink";
import { MatchVoteSection } from "@/components/tournament/MatchVoteSection";
import { EmptyState } from "@/components/ui/EmptyState";

interface ProfileSide {
  _id: unknown;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  owner?: { name?: string };
}

function toProfile(raw: unknown): ProfileSide | undefined {
  const side = raw as ProfileSide | undefined;
  if (!side?.name) return undefined;
  return side;
}

function ProfileColumn({
  side,
  tournamentId,
}: {
  side: ProfileSide;
  tournamentId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Image
          src={side.logoUrl}
          alt={side.name}
          width={48}
          height={48}
          className="ink-border h-12 w-12 shrink-0 rounded-md object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{side.name}</h2>
          <p className="mt-1 text-text-muted">{side.tagline}</p>
        </div>
      </div>

      <div className="ink-border hard-shadow-sm h-64 overflow-hidden rounded-xl sm:h-72">
        <LiveWebsitePreview url={side.websiteUrl} alt={side.name} />
      </div>

      <p className="whitespace-pre-line text-sm text-text-muted">{side.description}</p>

      <OutboundLink startupId={String(side._id)} tournamentId={tournamentId} href={side.websiteUrl} source="card">
        Visit {side.name} →
      </OutboundLink>
    </div>
  );
}

export default async function MatchVotePage({
  params,
}: {
  params: Promise<{ lang: string; id: string; matchId: string }>;
}) {
  const { lang, id, matchId } = await params;

  try {
    await dbConnect();
  } catch {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load this match." />
      </section>
    );
  }

  const match = await Match.findById(matchId)
    .populate([
      { path: "startupA", select: "name tagline description logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
      { path: "startupB", select: "name tagline description logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
    ])
    .lean();

  if (!match) notFound();
  if (match.tournament.toString() !== id) notFound();

  const startupA = toProfile(match.startupA);
  const startupB = toProfile(match.startupB);
  const backHref = `/${lang}/tournament/${id}`;

  if (!startupA || !startupB) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">This match isn&apos;t ready to vote on yet</h1>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to round
        </Link>
      </section>
    );
  }

  if (match.status !== "live" && match.status !== "overtime") {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Voting isn&apos;t open for this match</h1>
        <p className="mt-2 text-text-muted">This round has already closed.</p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to round
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <ProfileColumn side={startupA} tournamentId={id} />
        <ProfileColumn side={startupB} tournamentId={id} />
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <MatchVoteSection
          matchId={matchId}
          nameA={startupA.name}
          nameB={startupB.name}
          initialVotesA={match.votesA}
          initialVotesB={match.votesB}
        />
      </div>

      <Link href={backHref} className="mx-auto mt-6 block text-center text-sm font-semibold text-accent hover:underline">
        ← Back to round
      </Link>
    </section>
  );
}
