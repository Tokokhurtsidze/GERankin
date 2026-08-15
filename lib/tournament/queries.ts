import { dbConnect } from "@/lib/db/connect";
import { Tournament, Startup, type ITournament, type IStartup } from "@/lib/db/models";
import type { WinnerStartup } from "@/lib/tournament/winner-showcase";

export async function getActiveTournament(): Promise<ITournament | null> {
  await dbConnect();
  return Tournament.findOne({ status: { $in: ["registration", "seeding", "in_progress"] } })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getReigningChampion(): Promise<{ tournament: ITournament; startup: IStartup } | null> {
  await dbConnect();
  const tournament = await Tournament.findOne({ status: "completed", champion: { $ne: null } })
    .sort({ updatedAt: -1 })
    .lean();
  if (!tournament?.champion) return null;

  const startup = await Startup.findById(tournament.champion).lean();
  if (!startup) return null;

  return { tournament, startup };
}

/** Founder headcount for the homepage social-proof strip. One founder, currently. */
export async function getFounderCount(): Promise<number> {
  return 1;
}

/** All completed tournaments' champions, most-recent first, for the
 *  winner-startups showcase (homepage + /leaderboard). Returns null if
 *  the DB is unavailable, mirroring HallOfFame's previous behavior. */
export async function getWinnerStartups(): Promise<WinnerStartup[] | null> {
  try {
    await dbConnect();
    const tournaments = await Tournament.find({ status: "completed", champion: { $ne: null } })
      .sort({ updatedAt: -1 })
      .populate({ path: "champion", select: "name logoUrl websiteUrl" })
      .lean();

    type PopulatedChampion = { _id: { toString(): string }; name: string; logoUrl: string; websiteUrl: string };

    return tournaments
      .map((t) => t.champion as unknown as PopulatedChampion | undefined)
      .filter((champion): champion is PopulatedChampion => Boolean(champion))
      .map((champion) => ({
        id: champion._id.toString(),
        name: champion.name,
        logoUrl: champion.logoUrl,
        websiteUrl: champion.websiteUrl,
      }));
  } catch {
    return null;
  }
}
