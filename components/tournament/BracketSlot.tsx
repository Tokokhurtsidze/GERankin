import Image from "next/image";
import Link from "next/link";

/**
 * Fixed pixel size (width & height) of a single bracket competitor slot box.
 * Shared with the Tree/column-layout and connector-line components so box
 * geometry and line coordinates stay in sync — do not resize locally, change
 * this constant instead.
 */
export const BRACKET_SLOT_SIZE = 36;

export interface BracketSlotProps {
  startup: { id: string; name: string; logoUrl: string } | undefined;
  matchId: string;
  locale: string;
  tournamentId: string;
  status: string; // "live" | "overtime" | "pending" | "bye" | "completed"
  isWinner: boolean;
  isLoser: boolean;
  votes: number;
  /** false = render as a plain div instead of a Link — for callers (e.g. the
   * mobile match list) that wrap a bigger tap target around the whole card
   * themselves, where a nested <Link> would be invalid HTML. Default true. */
  asLink?: boolean;
}

export function BracketSlot({
  startup,
  matchId,
  locale,
  tournamentId,
  status,
  isWinner,
  isLoser,
  votes,
  asLink = true,
}: BracketSlotProps) {
  const isLive = status === "live" || status === "overtime";

  if (!startup) {
    return (
      <div
        style={{ width: BRACKET_SLOT_SIZE, height: BRACKET_SLOT_SIZE }}
        className="relative shrink-0 rounded-md border border-dashed border-border bg-transparent"
        aria-hidden="true"
      />
    );
  }

  const className = [
    "relative flex shrink-0 items-center justify-center rounded-md bg-surface transition-colors",
    isWinner ? "bg-accent-soft ring-2 ring-accent" : "ink-border",
    isLoser ? "opacity-50" : "",
  ].join(" ");

  const inner = (
    <>
      <Image
        src={startup.logoUrl}
        alt={startup.name}
        width={26}
        height={26}
        draggable={false}
        className="ink-border h-[26px] w-[26px] shrink-0 rounded-full object-cover"
      />
      <span
        className={[
          "font-mono-score absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none",
          isLive ? "bg-accent text-white" : "ink-border bg-surface text-text-muted",
        ].join(" ")}
      >
        {votes}
      </span>
    </>
  );

  if (!asLink) {
    return (
      <div style={{ width: BRACKET_SLOT_SIZE, height: BRACKET_SLOT_SIZE }} className={className} title={startup.name}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/tournament/${tournamentId}/match/${matchId}`}
      style={{ width: BRACKET_SLOT_SIZE, height: BRACKET_SLOT_SIZE }}
      className={className}
      title={startup.name}
    >
      {inner}
    </Link>
  );
}
