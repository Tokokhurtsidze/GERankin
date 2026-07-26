import { dbConnect } from "@/lib/db/connect";
import { Tournament, Startup, User, type ITournament, type IStartup } from "@/lib/db/models";

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

/** Real founder headcount for the homepage social-proof strip. */
export async function getFounderCount(): Promise<number> {
  await dbConnect();
  return User.countDocuments();
}
