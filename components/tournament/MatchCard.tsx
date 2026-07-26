import Image from "next/image";
import Link from "next/link";
import { VoteBar } from "./VoteBar";
import { VoteButtons } from "./VoteButtons";
import { MatchTimeline } from "./MatchTimeline";

export interface MatchCardSide {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  ownerName?: string;
}

export interface MatchCardData {
  id: string;
  startupA?: MatchCardSide;
  startupB?: MatchCardSide;
  votesA: number;
  votesB: number;
  status: string;
  winner?: string;
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SideBlock({ side, locale }: { side?: MatchCardSide; locale: string }) {
  if (!side) {
    return <div className="flex flex-1 items-center gap-3 text-text-muted">TBD</div>;
  }
  return (
    <Link href={`/${locale}/startup/${side.id}`} className="flex flex-1 items-center gap-3">
      <Image
        src={side.logoUrl}
        alt={side.name}
        width={40}
        height={40}
        className="ink-border h-10 w-10 shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold">{side.name}</p>
        <p className="truncate text-xs text-text-muted">{domainOf(side.websiteUrl)}</p>
        {side.ownerName && <p className="truncate text-xs text-text-muted">{side.ownerName}</p>}
      </div>
    </Link>
  );
}

export function MatchCard({
  match,
  locale,
  tournamentId,
  interactive,
}: {
  match: MatchCardData;
  locale: string;
  tournamentId: string;
  interactive: boolean;
}) {
  return (
    <div className="ink-border hard-shadow-sm rounded-xl bg-surface p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SideBlock side={match.startupA} locale={locale} />
        <span className="px-2 text-xs font-semibold uppercase text-text-muted">vs</span>
        <SideBlock side={match.startupB} locale={locale} />
      </div>

      <div className="mt-4">
        <VoteBar votesA={match.votesA} votesB={match.votesB} />
      </div>

      {match.status === "overtime" && (
        <p className="font-mono-score mt-2 text-center text-xs font-semibold uppercase text-accent">Overtime</p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MatchTimeline matchId={match.id} label="Timeline" />
        {interactive && match.startupA && match.startupB && (
          <div className="sm:w-56">
            <VoteButtons
              locale={locale}
              tournamentId={tournamentId}
              matchId={match.id}
              canVote={match.status === "live" || match.status === "overtime"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
