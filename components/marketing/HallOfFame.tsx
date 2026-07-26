import { dbConnect } from "@/lib/db/connect";
import { Tournament, type ITournament } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";

async function loadPastTournaments(): Promise<ITournament[] | null> {
  try {
    await dbConnect();
    return await Tournament.find({ status: "completed" }).sort({ updatedAt: -1 }).populate("champion").lean();
  } catch {
    return null;
  }
}

export async function HallOfFame() {
  const pastTournaments = await loadPastTournaments();

  if (pastTournaments === null) {
    return <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load the leaderboard." />;
  }

  if (pastTournaments.length === 0) {
    return <p className="text-center text-text-muted">No completed tournaments yet.</p>;
  }

  return (
    <ol className="mx-auto flex max-w-2xl flex-col gap-2">
      {pastTournaments.map((t) => (
        <li key={t._id.toString()} className="ink-border flex items-center justify-between rounded-lg bg-surface px-4 py-3">
          <span className="font-medium">{t.name}</span>
          <span className="font-semibold text-accent">
            {(t.champion as unknown as { name?: string })?.name ?? "TBD"}
          </span>
        </li>
      ))}
    </ol>
  );
}
