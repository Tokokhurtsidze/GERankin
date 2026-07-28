import { dbConnect } from "@/lib/db/connect";
import { Match, type ITournament } from "@/lib/db/models";
import { buildBracketTree, type TreeMatch, type TreeStartup } from "@/lib/bracket/tree";
import { BracketTree } from "./BracketTree";
import { ScaleToFitBracket } from "./ScaleToFitBracket";
import { EmptyState } from "@/components/ui/EmptyState";

interface PopulatedSide {
  _id: unknown;
  name: string;
  logoUrl: string;
}

function toTreeSide(raw: unknown): TreeStartup | undefined {
  const side = raw as PopulatedSide | undefined;
  if (!side?.name) return undefined;
  return { id: String(side._id), name: side.name, logoUrl: side.logoUrl };
}

/** Homepage teaser: the same mirrored bracket tree as the tournament page, non-interactive, scaled to fill its section. */
export async function HomeBracketTree({
  tournament,
  locale,
  dict,
}: {
  tournament: ITournament | null;
  locale: string;
  dict: { round: string; final: string };
}) {
  if (!tournament || tournament.status !== "in_progress") {
    return <EmptyState title="No live bracket right now" message="Matches will appear here once a tournament kicks off." />;
  }

  let tree;
  try {
    await dbConnect();
    const docs = await Match.find({ tournament: tournament._id })
      .populate([
        { path: "startupA", select: "name logoUrl" },
        { path: "startupB", select: "name logoUrl" },
      ])
      .lean();

    const treeMatches: TreeMatch[] = docs.map((m) => ({
      id: m._id.toString(),
      round: m.round,
      slot: m.slot,
      nextMatchId: m.nextMatch?.toString() ?? null,
      startupA: toTreeSide(m.startupA),
      startupB: toTreeSide(m.startupB),
      votesA: m.votesA,
      votesB: m.votesB,
      status: m.status,
      winnerId: m.winner?.toString() ?? null,
    }));

    tree = buildBracketTree(treeMatches, tournament.totalRounds);
  } catch {
    return <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load the bracket." />;
  }

  return (
    <ScaleToFitBracket>
      <BracketTree
        tree={tree}
        locale={locale}
        tournamentId={tournament._id.toString()}
        dict={dict}
        interactive={false}
      />
    </ScaleToFitBracket>
  );
}
