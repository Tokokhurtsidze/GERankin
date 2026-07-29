import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Match, Vote } from "@/lib/db/models";
import { MatchCompareGrid } from "@/components/tournament/MatchCompareGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { auth } from "@/lib/auth/auth";
import type { LocalizedText } from "@/lib/i18n/localized";
import { pickLocalized } from "@/lib/i18n/localized";

interface ProfileSide {
  _id: unknown;
  name: string;
  tagline: LocalizedText;
  logoUrl: string;
  websiteUrl: string;
}

function toProfile(raw: unknown): ProfileSide | undefined {
  const side = raw as ProfileSide | undefined;
  if (!side?.name) return undefined;
  return side;
}

export default async function MatchVotePage({
  params,
}: {
  params: Promise<{ lang: string; id: string; matchId: string }>;
}) {
  const { lang, id, matchId } = await params;
  if (!isLocale(lang)) notFound();
  if (!isValidObjectId(id) || !isValidObjectId(matchId)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  try {
    await dbConnect();
  } catch {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Database not connected" message={dict.match.dbNotConnectedBody} />
      </section>
    );
  }

  const match = await Match.findById(matchId)
    .populate([
      { path: "startupA", select: "name tagline logoUrl websiteUrl" },
      { path: "startupB", select: "name tagline logoUrl websiteUrl" },
    ])
    .lean();

  if (!match) notFound();
  if (match.tournament.toString() !== id) notFound();

  const startupA = toProfile(match.startupA);
  const startupB = toProfile(match.startupB);
  const backHref = `/${lang}/tournament/${id}`;

  const session = await auth();
  const existingVote = session?.user
    ? await Vote.findOne({ match: matchId, voter: session.user.id }).lean()
    : null;
  const initialVoted = existingVote ? (existingVote.side as "A" | "B") : null;

  if (!startupA || !startupB) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{dict.match.notReadyTitle}</h1>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          {dict.match.backToRound}
        </Link>
      </section>
    );
  }

  if (match.status !== "live" && match.status !== "overtime") {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{dict.match.votingClosedTitle}</h1>
        <p className="mt-2 text-text-muted">{dict.match.roundClosedBody}</p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          {dict.match.backToRound}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1800px] px-4 py-4 sm:px-8 lg:px-12">
      <MatchCompareGrid
        matchId={matchId}
        tournamentId={id}
        startupA={{ id: String(startupA._id), name: startupA.name, tagline: pickLocalized(startupA.tagline, locale), logoUrl: startupA.logoUrl, websiteUrl: startupA.websiteUrl }}
        startupB={{ id: String(startupB._id), name: startupB.name, tagline: pickLocalized(startupB.tagline, locale), logoUrl: startupB.logoUrl, websiteUrl: startupB.websiteUrl }}
        initialVotesA={match.votesA}
        initialVotesB={match.votesB}
        initialVoted={initialVoted}
        backHref={backHref}
        dict={dict.match}
      />
    </section>
  );
}
