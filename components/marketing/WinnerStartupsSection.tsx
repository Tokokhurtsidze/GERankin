import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { splitWinnerColumns, type WinnerStartup } from "@/lib/tournament/winner-showcase";

function WinnerColumn({
  winners,
  startIndex,
  step,
}: {
  winners: WinnerStartup[];
  startIndex: number;
  step: number;
}) {
  return (
    <div className="flex flex-row flex-wrap justify-center gap-3 sm:flex-col sm:items-center">
      {winners.map((winner, i) => (
        <a
          key={winner.id}
          href={winner.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="reveal-up ink-border block h-14 w-14 shrink-0 overflow-hidden rounded-lg"
          style={{ "--reveal-index": startIndex + i * step } as CSSProperties}
        >
          <Image
            src={winner.logoUrl}
            alt={winner.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}

export function WinnerStartupsSection({
  winners,
  dict,
  children,
}: {
  winners: WinnerStartup[] | null;
  dict: Dictionary;
  children: ReactNode;
}) {
  if (winners === null) {
    return (
      <div className="flex flex-col gap-6">
        {children}
        <EmptyState title="Database not connected" message={dict.leaderboard.dbNotConnectedBody} />
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {children}
        <p className="text-center text-text-muted">{dict.leaderboard.noCompleted}</p>
      </div>
    );
  }

  const { left, right } = splitWinnerColumns(winners);

  return (
    <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1fr_minmax(0,2fr)_1fr] sm:gap-10">
      <div className="sm:order-2">{children}</div>
      <div className="sm:order-1">
        <WinnerColumn winners={left} startIndex={0} step={2} />
      </div>
      {right.length > 0 && (
        <div className="sm:order-3">
          <WinnerColumn winners={right} startIndex={1} step={2} />
        </div>
      )}
    </div>
  );
}
