export function VoteBar({ votesA, votesB }: { votesA: number; votesB: number }) {
  const total = votesA + votesB;
  const pctA = total === 0 ? 50 : Math.round((votesA / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono-score w-8 text-right text-sm font-semibold">{votesA}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pctA}%` }} />
      </div>
      <span className="font-mono-score w-8 text-sm font-semibold text-text-muted">{votesB}</span>
    </div>
  );
}
