import type { CSSProperties } from "react";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, type ITournament } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

async function loadPastTournaments(): Promise<ITournament[] | null> {
  try {
    await dbConnect();
    return await Tournament.find({ status: "completed" }).sort({ updatedAt: -1 }).populate("champion").lean();
  } catch {
    return null;
  }
}

export async function HallOfFame({ dict }: { dict: Dictionary }) {
  const pastTournaments = await loadPastTournaments();

  if (pastTournaments === null) {
    return <EmptyState title="Database not connected" message={dict.leaderboard.dbNotConnectedBody} />;
  }

  if (pastTournaments.length === 0) {
    return <p className="text-center text-text-muted">{dict.leaderboard.noCompleted}</p>;
  }

  return (
    <ol className="mx-auto flex max-w-2xl flex-col gap-2">
      {pastTournaments.map((t, i) => (
        <li
          key={t._id.toString()}
          className="reveal-up ink-border flex items-center justify-between rounded-lg bg-surface px-4 py-3"
          style={{ "--reveal-index": i } as unknown as CSSProperties}
        >
          <span className="font-medium">{t.name}</span>
          <span className="font-semibold text-accent">
            {(t.champion as unknown as { name?: string })?.name ?? dict.match.tbd}
          </span>
        </li>
      ))}
    </ol>
  );
}
