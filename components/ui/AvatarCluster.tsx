/** Decorative overlapping avatar stack — abstract initials, not real people. */
export function AvatarCluster({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
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
        Join <span className="font-semibold text-text">{count.toLocaleString()}</span> {label}
      </p>
    </div>
  );
}
