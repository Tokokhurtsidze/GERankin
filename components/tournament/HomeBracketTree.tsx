import { dbConnect } from "@/lib/db/connect";
import { Match, type ITournament } from "@/lib/db/models";
import { buildBracketTree } from "@/lib/bracket/tree";
import { matchDocsToTreeMatches } from "@/lib/bracket/serialize";
import { BracketTree } from "./BracketTree";
import { ScaleToFitBracket } from "./ScaleToFitBracket";
import { EmptyState } from "@/components/ui/EmptyState";

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

    const treeMatches = matchDocsToTreeMatches(docs);

    tree = buildBracketTree(treeMatches, tournament.totalRounds);
  } catch {
    return <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load the bracket." />;
  }

  return (
    <div className="reveal-up h-full w-full">
      <ScaleToFitBracket>
        <BracketTree
          tree={tree}
          locale={locale}
          tournamentId={tournament._id.toString()}
          dict={dict}
          interactive={false}
        />
      </ScaleToFitBracket>
    </div>
  );
}
