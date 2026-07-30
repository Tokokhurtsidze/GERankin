# Winner Startups Showcase — Design

## Context

The homepage's `#leaderboard` section currently renders `HallOfFame`
(`components/marketing/HallOfFame.tsx`), a text-only `<ol>` listing each
completed tournament's name next to its champion's *name* (no logo, no
link). Separately, the hero section renders `ChampionShowcase`
(`components/tournament/ChampionShowcase.tsx`), a single card for the
single *current reigning* champion, with logo + link + tagline.

The data model has one champion per tournament
(`Tournament.champion: Types.ObjectId` ref `Startup`). There is no
`winners` array and no `isWinner` flag — "winner startups" (plural) means
the set of champions across all completed tournaments, one per
tournament.

Goal: replace the leaderboard section's list with a wireframed layout —
a center block flanked left/right by clickable winner-startup logos —
and give admins a way to remove a startup from that showcase without
deleting the underlying tournament/startup data.

## Scope

- Homepage `#leaderboard` section only. The hero's `ChampionShowcase`
  (single reigning champion) is unchanged — it has no "multiple winners"
  concept to lay out.
- No schema changes. `Tournament.champion` stays a single optional ref.

## Component: `WinnerStartupsShowcase`

Replaces `HallOfFame` in `app/[lang]/page.tsx`'s `#leaderboard` section.
Keeps the section's existing heading/intro text in `page.tsx` untouched
(the "center intro text" the user asked to preserve) — the new component
only replaces the `<HallOfFame dict={dict} />` list body with the
flanking-logo layout, rendered below/around that existing intro.

**Data**: query completed tournaments with a champion, most-recent
first, same as `HallOfFame.loadPastTournaments` but widening the
`populate("champion")` select to include `logoUrl` and `websiteUrl` (not
just `name`):

```ts
Tournament.find({ status: "completed", champion: { $ne: null } })
  .sort({ updatedAt: -1 })
  .populate({ path: "champion", select: "name logoUrl websiteUrl" })
  .lean();
```

Map to a flat list of `{ id, name, logoUrl, websiteUrl }` (dropping
entries whose champion failed to populate, e.g. deleted startup).

**Layout / distribution**:
- 0 winners: keep existing empty-state message (`dict.leaderboard.noCompleted`).
- 1 winner: single logo tile, left column only.
- 2+ winners: split into two arrays — even indices (0, 2, 4, …) go left,
  odd indices (1, 3, 5, …) go right — so the most recent winner is
  top-left, second-most-recent top-right, etc. On an odd total, the left
  column ends up with one more tile than the right, matching the
  wireframe's flanking-columns shape without a visually empty slot.
- Each column is a vertical stack of square logo tiles (mirrors the
  wireframe's boxes), reusing `ChampionShowcase`'s link pattern:
  `<a href={websiteUrl} target="_blank" rel="noopener noreferrer">` wrapping
  `<Image src={logoUrl} alt={name}>`. No name or tournament caption
  rendered under the tile — logo is the only visible content, click →
  website (per explicit confirmation).
- Responsive: below `sm`, columns stack under the center content instead
  of flanking it (flanking requires horizontal room).

**Error handling**: on DB-connect failure, same `EmptyState` fallback as
today (`"Database not connected"`).

## Admin control: remove a winner from the showcase

On `/[lang]/admin/tournaments`, for each tournament row where
`status === "completed" && champion` is set, add a "Remove from
showcase" button next to the existing `DeleteTournamentButton`.

- New component `RemoveChampionButton` (client component), modeled on
  `DeleteTournamentButton`'s confirm-dialog pattern but without the
  type-the-name gate, since this is non-destructive to underlying data
  (no delete of tournament/startup/matches/votes) — it only clears the
  tournament's `champion` pointer.
- New endpoint: `PATCH /api/admin/tournaments/[id]`, admin-only (same
  auth check as the existing `DELETE` handler), body-less. Validates
  the id, then `Tournament.findByIdAndUpdate(id, { $unset: { champion: 1 } })`.
  Returns 404 if the tournament doesn't exist, 400 for an invalid id,
  401 for non-admin.
- After success, `router.refresh()` so the admin list and (on next
  homepage load) the showcase reflect the change.

## Testing

- Unit test for the left/right distribution helper (even/odd split,
  1-winner-goes-left, 0-winner empty case) — pure function, easy to
  test in isolation, following the existing `pickNextMatch`-style helper
  pattern already in the codebase.
- API test for `PATCH /api/admin/tournaments/[id]`: 401 for non-admin,
  400 for invalid id, 404 for missing tournament, 200 + unsets
  `champion` for a valid completed tournament.

## Out of scope / explicitly not doing

- No change to `ChampionShowcase` (hero) or its data source.
- No schema change (`Tournament.champion` stays singular).
- No tournament-name caption under logo tiles (explicitly declined).
- No delete of the underlying `Startup` document from this flow — that
  remains via the existing full tournament delete.
