/** Decorative overlapping avatar stack — abstract initials, not real people. */
export function AvatarCluster({ count, joinWord, label }: { count: number; joinWord: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
      <div className="flex -space-x-2">
        {["A", "B", "C", "D", "E"].map((letter) => (
          <span
            key={letter}
            className="ink-border flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted"
          >
            {letter}
          </span>
        ))}
      </div>
      <p className="text-sm text-text-muted">
        {joinWord} <span className="font-semibold text-text">{count.toLocaleString()}</span> {label}
      </p>
    </div>
  );
}
