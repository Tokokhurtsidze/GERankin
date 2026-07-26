interface BracketSide {
  name: string;
  logoUrl: string;
}

interface BracketMatch {
  _id: string;
  round: number;
  slot: number;
  startupA?: BracketSide;
  startupB?: BracketSide;
  votesA: number;
  votesB: number;
  status: string;
  winner?: string;
}

function MiniMatchCard({ match }: { match: BracketMatch }) {
  return (
    <div className="ink-border flex w-56 flex-col gap-1 rounded-lg bg-surface p-3 text-sm">
      {[
        { side: match.startupA, votes: match.votesA },
        { side: match.startupB, votes: match.votesB },
      ].map((row, i) => (
        <div
          key={i}
          className={`flex items-center justify-between rounded px-2 py-1 ${
            match.status === "completed" && row.side?.name && match.winner ? "font-semibold" : ""
          }`}
        >
          <span className="truncate">{row.side?.name ?? "TBD"}</span>
          <span className="font-mono-score text-text-muted">{row.votes}</span>
        </div>
      ))}
      {match.status === "overtime" && (
        <span className="mt-1 text-center text-xs font-semibold uppercase text-accent">Overtime</span>
      )}
    </div>
  );
}

/** Compact multi-round overview strip — used for secondary previews. */
export function BracketOverview({ rounds }: { rounds: BracketMatch[][] }) {
  return (
    <div className="flex gap-10 overflow-x-auto pb-4">
      {rounds.map((round, roundIdx) => (
        <div key={roundIdx} className="flex flex-col justify-around gap-6">
          <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
            Round {roundIdx + 1}
          </h2>
          {round.map((match) => (
            <MiniMatchCard key={match._id} match={match} />
          ))}
        </div>
      ))}
    </div>
  );
}
