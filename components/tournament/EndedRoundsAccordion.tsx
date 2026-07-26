"use client";

import { useState } from "react";
import { MatchCard, type MatchCardData } from "./MatchCard";

export interface EndedRound {
  round: number;
  endedAt: string;
  matches: MatchCardData[];
}

export function EndedRoundsAccordion({
  rounds,
  locale,
  label,
  matchesLabel,
}: {
  rounds: EndedRound[];
  locale: string;
  label: string;
  matchesLabel: string;
}) {
  const [openRound, setOpenRound] = useState<number | null>(null);

  if (rounds.length === 0) return null;

  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{label}</h3>
      <div className="mt-4 flex flex-col gap-2">
        {rounds.map((r) => {
          const isOpen = openRound === r.round;
          return (
            <div key={r.round} className="ink-border rounded-lg bg-surface">
              <button
                onClick={() => setOpenRound(isOpen ? null : r.round)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium">
                  Round {r.round} <span className="text-text-muted">· {r.matches.length} {matchesLabel}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-text-muted">
                  {new Date(r.endedAt).toLocaleDateString()}
                  <span>{isOpen ? "−" : "+"}</span>
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-3 border-t border-border p-4">
                  {r.matches.map((m) => (
                    <MatchCard key={m.id} match={m} locale={locale} interactive={false} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
