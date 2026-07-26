# Dedicated vote-compare page + optional Turnstile

## Motivation

Two problems reported against the current voting flow:

1. Voting is currently blocked in any environment without `NEXT_PUBLIC_TURNSTILE_SITE_KEY` /
   `TURNSTILE_SECRET_KEY` configured — `TurnstileWidget` renders a "Bot verification not
   configured" message and never calls `onVerify`, so `VoteButtons`' pick-a-side buttons stay
   permanently disabled (`disabled={!token || pending}`). Local dev has no way to cast a vote.
2. The in-place vote flow (tap Vote → inline Turnstile + two small named buttons inside the
   match card) doesn't give the voter enough to go on — no way to see either startup's actual
   site/description before picking a side.

## Goals

- Voting must work end-to-end with zero Turnstile env vars set, and re-enable the real check
  automatically the moment real keys are added — no follow-up code change needed later.
- Clicking "Vote" on a match takes the user to a dedicated page showing both startups' full
  profiles side by side (same content as the existing `/startup/[id]` page), so they can actually
  evaluate before picking a winner.

## Non-goals

- No changes to the vote-counting logic, tie-break rules, or the `Vote`/`Match` schemas.
- No changes to `Match Card`'s Share or Timeline behavior — only the Vote button's target changes.
- Not building a general "compare any two startups" tool — this page is scoped to one specific
  live `Match`.

## Architecture

### New route: `app/[lang]/tournament/[id]/match/[matchId]/page.tsx`

Server component. Fetches the `Match` by id, populated the same way `tournament/[id]/page.tsx`
already does (`startupA`/`startupB` with `name logoUrl websiteUrl owner`), plus additionally
selects `tagline` and `description` (not currently selected by the existing populate — needed for
full-profile parity with `/startup/[id]`).

Guards, in order:
- Match not found → `notFound()`.
- `match.status` not `"live"`/`"overtime"` → render a plain "Voting isn't open for this match"
  message (mirrors the existing `RegisterStartupForm` full-tournament message style), with a link
  back to `/tournament/[id]`.

Layout: two columns (stacks to one on mobile), each column rendering:
- Logo, name, tagline (header block, same as `/startup/[id]`'s `<h1>`/`<p>`)
- `LiveWebsitePreview` (reused as-is)
- Description (`whitespace-pre-line`, reused as-is)
- `OutboundLink` ("Visit {name} →", reused as-is)

Below both columns: the vote picker (see below), and a live `VoteBar` showing current tally.

### Vote picker component: `components/tournament/MatchVotePicker.tsx` (new, client)

Replaces the "expanded" branch that currently lives inside `VoteButtons`. Same state machine
(`idle → verifying/picking → voted`), same `/api/vote` call, but full-width on its own page instead
of squeezed into a `sm:w-56` card footer. Rendered once per match page (not per match card).

`VoteButtons` (used by `MatchCard`) shrinks to: a `Vote` link (`href="/${locale}/tournament/${tournamentId}/match/${matchId}"`)
and the existing `Share` button. No inline expansion, no Turnstile in the list view. `MatchCard`
gains a `tournamentId` prop (not currently passed through) so it can build that link.

### `MatchCard` changes

- New required prop `tournamentId: string` (threaded from both call sites — `LiveBracketSection`
  on the homepage and `tournament/[id]/page.tsx` — both of which already have the tournament id in
  scope).
- `interactive` prop's meaning narrows: it now only gates whether the Vote link is shown at all
  (still hidden for non-live matches / non-`in_progress` tournaments) — the actual voting UI moves
  off this component entirely.

## Turnstile — skip when unconfigured

- `lib/turnstile/verify.ts`: `verifyTurnstileToken` returns `true` immediately, without calling the
  Cloudflare API, when `process.env.TURNSTILE_SECRET_KEY` is unset.
- `TurnstileWidget`: when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset, instead of the current dead-end
  message, immediately call `onVerify("skipped")` (or any non-empty sentinel) on mount so the
  picker considers itself "verified" and proceeds straight to the pick-a-side buttons.
- `/api/vote`'s `bodySchema`: `turnstileToken` becomes `z.string().optional()`. The route only
  calls `verifyTurnstileToken` (and 403s on failure) when `process.env.TURNSTILE_SECRET_KEY` is
  set; otherwise it skips the check entirely (token, if present, is ignored).
- Net result: three independent layers (widget, verify function, API route) all degrade gracefully
  in the same direction — configuring real keys anywhere re-activates the real check everywhere,
  with no other code change.

## Post-vote behavior

`MatchVotePicker`'s `voted` state (already exists in today's `VoteButtons`, reused) shows "Vote
cast for {name}". The page around it doesn't redirect — both profiles stay visible, and a static
"← Back to round" link (`/tournament/[id]`) sits below the picker for the user to navigate back
manually. This is new behavior (today's inline `VoteBar` doesn't react to a same-page vote at all,
it only reflects whatever was server-rendered): the page's `VoteBar` needs its `votesA`/`votesB`
lifted into local state so `MatchVotePicker` can bump the right side by one on a successful
response, giving the voter immediate feedback without a full reload.

## Edge cases

- Match already has a vote from this user → `/api/vote` already 409s ("You already voted in this
  match") via the unique index on `Vote`; `MatchVotePicker` surfaces that as the existing inline
  error text (`error` state already handled by today's `VoteButtons` code, carried over as-is).
- Round ends (match flips out of `live`/`overtime`) while the page is open → next vote attempt hits
  the existing 409 ("Voting is not open for this match") from `/api/vote`; no special client-side
  polling added, this matches how the current inline flow already behaves (errors surface only on
  submit, not proactively).
- One side is a bye (`startupB` undefined) → this route is only reachable for matches with both
  sides present, since `MatchCard` only renders the Vote link when `match.startupA && match.startupB`
  (existing guard, unchanged).

## Testing / verification

This repo has no test runner configured at all (no `test` script, no `.test.ts` files outside
`node_modules`) — `lib/bracket/generate.ts` and `lib/bracket/tiebreak.ts`, the other pure-logic
modules, have no automated tests either. Matching that existing convention, this feature will be
verified manually against the real dev DB (same approach used earlier this session for the
tournament-start and stale-data fixes):

- Load the new match page for a live match with no Turnstile keys set → confirm the vote picker is
  usable immediately (no dead "not configured" block).
- Cast a vote → confirm `votesA`/`votesB` increments in Mongo and the page reflects it without
  reload.
- Attempt a second vote as the same user → confirm the existing "already voted" error surfaces.
- Click Vote from the round list on `/tournament/[id]` → confirm it lands on the right match's
  compare page with both profiles rendering (including the live iframe preview / microlink
  fallback).
