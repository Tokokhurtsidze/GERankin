"use client";

import Link from "next/link";

export function VoteButtons({
  locale,
  tournamentId,
  matchId,
  canVote,
}: {
  locale: string;
  tournamentId: string;
  matchId: string;
  canVote: boolean;
}) {
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: "Startup Clash GE", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex gap-2">
      <Link
        href={canVote ? `/${locale}/tournament/${tournamentId}/match/${matchId}` : "#"}
        aria-disabled={!canVote}
        className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold text-white ${
          canVote ? "bg-accent hover:bg-accent-hover" : "pointer-events-none cursor-not-allowed bg-accent opacity-40"
        }`}
      >
        Vote
      </Link>
      <button onClick={handleShare} className="ink-border rounded-md bg-surface px-4 py-2 text-sm font-semibold">
        Share
      </button>
    </div>
  );
}
