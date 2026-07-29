# Seamless vote auto-advance across matchups

## Motivation

Voting on a matchup currently strands the user on that match page — they must manually
navigate back to the bracket and pick the next matchup themselves. For a bracket with many
concurrent live matchups (e.g. 5 in a 10-startup Round 1), this is friction: the desired flow
is to vote once per matchup, back-to-back, without leaving the match view.

The underlying restriction rules (one vote per matchup per user, participants excluded
tournament-wide, tournament-isolated voting history) already hold correctly in the current
schema and API — this spec only adds the auto-advance UX and the minimal server support it needs.

## Goals

- After a successful vote, automatically load the next matchup in the current round that this
  user hasn't voted in yet and is eligible to vote in — no manual click back to the bracket.
- If no such matchup remains in the current round, return to the bracket view
  (`/{lang}/tournament/{id}`).
- Preserve the existing vote-confirmation feedback (checkmark + vote-count bump animation)
  before navigating — advance is not instant, it follows the existing ~600ms bump animation.

## Non-goals

- No change to the vote eligibility rules themselves (`Vote` unique index, participant check) —
  confirmed already correct: match-scoped unique index (not global), and tournament-scoped
  participant check (`Startup.exists({owner, tournament: match.tournament})`). Voting in a prior
  tournament never blocks voting in a new one, and this spec does not touch that logic.
- No auto-advance into a *different* round. If the current round is exhausted for this user but
  a later round happens to already be live, the user still returns to the bracket and navigates
  manually.
- No change to how matches become "live"/"overtime"/"completed" — this spec only reacts to
  matches that are already live.

## Architecture

### 1. API: `app/api/vote/route.ts`

After the vote transaction commits, compute the next eligible matchup for this voter within the
same `tournament` + `round`:

1. Fetch sibling matches: `Match.find({ tournament: match.tournament, round: match.round, status: { $in: ["live", "overtime"] } }).select("_id").sort({ slot: 1 }).lean()`.
2. Fetch this voter's existing votes among those siblings: `Vote.find({ voter: session.user.id, match: { $in: siblingIds } }).select("match").lean()`, build a `Set` of voted match ids (the just-cast vote is already committed, so the current match is included in this set).
3. `nextMatchId` = first sibling id not in that set, or `null` if none remain.

Response becomes `{ ok: true, nextMatchId: string | null }`.

No new index needed — reuses the existing `{tournament, round, slot}` and `{status}` indexes on
`Match`, and the existing `{match, voter}` unique index on `Vote`.

### 2. Frontend: `components/tournament/MatchCompareGrid.tsx`

- Add a `lang: string` prop (threaded from `app/[lang]/tournament/[id]/match/[matchId]/page.tsx`,
  which already has `locale` in scope).
- Add `useRouter` from `next/navigation`.
- In `castVote`'s success branch, read `nextMatchId` from the response. Keep the existing
  `setVoted`/`setBumped`/bump-animation flow unchanged, then after the same 600ms timeout that
  currently clears `bumped`, navigate:
  - `router.push(`/${lang}/tournament/${tournamentId}/match/${nextMatchId}`)` if `nextMatchId` is present.
  - `router.push(backHref)` otherwise (falls back to the bracket view).

Navigating to a new `matchId` route re-runs `MatchVotePage` server-side (fresh `Match`/`Vote`
lookups) and remounts `MatchCompareGrid`, which naturally resets `token`/`voted`/vote-count state
and forces a fresh Turnstile challenge for the new matchup — no extra reset logic needed.

## Error handling

Unchanged from today: a failed vote (already voted, round closed, turnstile failure, network
error) shows the existing error banner and does not navigate anywhere.

## Testing

- Manual: vote through a full round with a non-participant test account, confirm auto-advance
  hits every live matchup exactly once and lands on the bracket after the last one.
- Manual: confirm a participant account still gets the existing 403 and never reaches the
  advance logic.
- Manual: confirm a fresh Turnstile challenge appears on each auto-advanced matchup.
