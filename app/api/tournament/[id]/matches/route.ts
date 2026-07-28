import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, Match } from "@/lib/db/models";
import { matchDocsToTreeMatches } from "@/lib/bracket/serialize";
import { objectIdString } from "@/lib/db/object-id";

const populateOpts = [
  { path: "startupA", select: "name logoUrl" },
  { path: "startupB", select: "name logoUrl" },
];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const tournament = await Tournament.findById(id).lean();
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const allMatches = await Match.find({ tournament: id }).populate(populateOpts).sort({ round: 1, slot: 1 }).lean();

  return NextResponse.json({
    tournament: {
      status: tournament.status,
      currentRound: tournament.currentRound,
      totalRounds: tournament.totalRounds,
    },
    matches: matchDocsToTreeMatches(allMatches),
  });
}
