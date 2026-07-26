"use client";

import { useState } from "react";
import { VoteBar } from "./VoteBar";
import { MatchVotePicker } from "./MatchVotePicker";

export function MatchVoteSection({
  matchId,
  nameA,
  nameB,
  initialVotesA,
  initialVotesB,
}: {
  matchId: string;
  nameA: string;
  nameB: string;
  initialVotesA: number;
  initialVotesB: number;
}) {
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);

  function handleVoted(side: "A" | "B") {
    if (side === "A") setVotesA((v) => v + 1);
    else setVotesB((v) => v + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <VoteBar votesA={votesA} votesB={votesB} />
      <MatchVotePicker matchId={matchId} nameA={nameA} nameB={nameB} onVoted={handleVoted} />
    </div>
  );
}
