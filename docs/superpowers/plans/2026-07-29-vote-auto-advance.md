# Vote Auto-Advance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a user votes on a matchup, automatically load the next matchup in the current round they haven't voted in yet, or return to the bracket if none remain.

**Architecture:** A pure helper function picks the next eligible match id from an already-fetched list of sibling matches + voted match ids (unit-testable, no DB). The vote API route calls it after committing a vote and returns `nextMatchId` in its response. The client component navigates there (or to the bracket) after its existing vote-confirmation animation.

**Tech Stack:** Next.js App Router, Mongoose, Vitest, `next/navigation` (`useRouter`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-29-vote-auto-advance-design.md`
- No changes to vote eligibility rules (unique `{match, voter}` index, tournament-scoped participant check) — those already satisfy the requirements.
- Auto-advance only within the current round; never jumps to a different round.
- Existing ~600ms bump-animation timing before navigating (matches current `bumped` state clear timeout in `MatchCompareGrid.tsx`).
- This repo's test convention: pure logic in `lib/**` gets a Vitest `*.test.ts` file; API routes and components are verified manually (no existing precedent for route/component tests — don't introduce one here).

---

### Task 1: `pickNextMatch` helper

**Files:**
- Create: `lib/bracket/next-match.ts`
- Test: `lib/bracket/next-match.test.ts`

**Interfaces:**
- Produces: `pickNextMatch(siblings: MatchSlotRef[], votedMatchIds: Iterable<string>): string | null` and `interface MatchSlotRef { id: string; slot: number }` — both exported from `lib/bracket/next-match.ts`. Task 2 imports both.

- [ ] **Step 1: Write the failing test**

Create `lib/bracket/next-match.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pickNextMatch, type MatchSlotRef } from "./next-match";

const siblings: MatchSlotRef[] = [
  { id: "match-0", slot: 0 },
  { id: "match-1", slot: 1 },
  { id: "match-2", slot: 2 },
];

describe("pickNextMatch", () => {
  it("returns the lowest-slot match not yet voted in", () => {
    expect(pickNextMatch(siblings, ["match-0"])).toBe("match-1");
  });

  it("ignores voted-id order and always returns by ascending slot", () => {
    expect(pickNextMatch(siblings, ["match-1", "match-0"])).toBe("match-2");
  });

  it("returns null when every sibling is voted", () => {
    expect(pickNextMatch(siblings, ["match-0", "match-1", "match-2"])).toBeNull();
  });

  it("returns the lowest-slot match when none are voted", () => {
    expect(pickNextMatch(siblings, [])).toBe("match-0");
  });

  it("does not mutate the input siblings array order", () => {
    const unsorted: MatchSlotRef[] = [
      { id: "match-2", slot: 2 },
      { id: "match-0", slot: 0 },
      { id: "match-1", slot: 1 },
    ];
    expect(pickNextMatch(unsorted, ["match-0"])).toBe("match-1");
    expect(unsorted.map((m) => m.id)).toEqual(["match-2", "match-0", "match-1"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/bracket/next-match.test.ts`
Expected: FAIL — `Cannot find module './next-match'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `lib/bracket/next-match.ts`:

```ts
export interface MatchSlotRef {
  id: string;
  slot: number;
}

// Picks the lowest-slot sibling match this voter hasn't voted in yet, or null
// if they've voted in all of them (or there are none). Never mutates `siblings`.
export function pickNextMatch(
  siblings: MatchSlotRef[],
  votedMatchIds: Iterable<string>
): string | null {
  const voted = new Set(votedMatchIds);
  const sorted = [...siblings].sort((a, b) => a.slot - b.slot);
  const next = sorted.find((m) => !voted.has(m.id));
  return next ? next.id : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/bracket/next-match.test.ts`
Expected: PASS — all 5 assertions green.

- [ ] **Step 5: Commit**

```bash
git add lib/bracket/next-match.ts lib/bracket/next-match.test.ts
git commit -m "feat: add pickNextMatch helper for vote auto-advance"
```

---

### Task 2: Wire `nextMatchId` into the vote API response

**Files:**
- Modify: `app/api/vote/route.ts`

**Interfaces:**
- Consumes: `pickNextMatch(siblings, votedMatchIds)` and `MatchSlotRef` from `lib/bracket/next-match.ts` (Task 1).
- Produces: `POST /api/vote` response shape changes from `{ ok: true }` to `{ ok: true, nextMatchId: string | null }`. Task 3's client code consumes `nextMatchId` from this response.

- [ ] **Step 1: Add the import**

In `app/api/vote/route.ts`, add to the top imports (after the existing `objectIdString` import):

```ts
import { pickNextMatch } from "@/lib/bracket/next-match";
```

- [ ] **Step 2: Replace the final response with the next-match lookup**

Find the end of the file:

```ts
  } finally {
    await dbSession.endSession();
  }

  return NextResponse.json({ ok: true });
}
```

Replace the `return NextResponse.json({ ok: true });` line with:

```ts
  } finally {
    await dbSession.endSession();
  }

  // Auto-advance support: find the next live/overtime sibling matchup in this
  // round that this voter hasn't voted in yet, so the client can jump straight
  // there instead of stranding the user on the match they just voted in.
  const siblingMatches = await Match.find({
    tournament: match.tournament,
    round: match.round,
    status: { $in: ["live", "overtime"] },
  })
    .select("_id slot")
    .lean();

  const siblingIds = siblingMatches.map((m) => m._id.toString());
  const votedDocs = await Vote.find({
    voter: session.user.id,
    match: { $in: siblingIds },
  })
    .select("match")
    .lean();

  const nextMatchId = pickNextMatch(
    siblingMatches.map((m) => ({ id: m._id.toString(), slot: m.slot })),
    votedDocs.map((v) => v.match.toString())
  );

  return NextResponse.json({ ok: true, nextMatchId });
}
```

- [ ] **Step 3: Run the full test suite to make sure nothing broke**

Run: `npm test`
Expected: PASS — all existing suites plus Task 1's new one green (this route has no test file of its own, per this repo's convention).

- [ ] **Step 4: Run the linter**

Run: `npm run lint`
Expected: no errors on `app/api/vote/route.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/api/vote/route.ts
git commit -m "feat: return nextMatchId from the vote API for auto-advance"
```

---

### Task 3: Client-side auto-advance navigation

**Files:**
- Modify: `components/tournament/MatchCompareGrid.tsx`
- Modify: `app/[lang]/tournament/[id]/match/[matchId]/page.tsx`

**Interfaces:**
- Consumes: `nextMatchId` field on the `POST /api/vote` JSON response (Task 2).

- [ ] **Step 1: Pass `lang` down from the page**

In `app/[lang]/tournament/[id]/match/[matchId]/page.tsx`, find the `<MatchCompareGrid ... />` call (around line 94-104) and add a `lang={lang}` prop:

```tsx
      <MatchCompareGrid
        matchId={matchId}
        tournamentId={id}
        lang={lang}
        startupA={{ id: String(startupA._id), name: startupA.name, tagline: pickLocalized(startupA.tagline, locale), logoUrl: startupA.logoUrl, websiteUrl: startupA.websiteUrl }}
        startupB={{ id: String(startupB._id), name: startupB.name, tagline: pickLocalized(startupB.tagline, locale), logoUrl: startupB.logoUrl, websiteUrl: startupB.websiteUrl }}
        initialVotesA={match.votesA}
        initialVotesB={match.votesB}
        initialVoted={initialVoted}
        backHref={backHref}
        dict={dict.match}
      />
```

- [ ] **Step 2: Add the `lang` prop and `useRouter` import to `MatchCompareGrid`**

In `components/tournament/MatchCompareGrid.tsx`, add to the imports:

```ts
import { useRouter } from "next/navigation";
```

Add `lang: string;` to the `MatchCompareGrid` props type (alongside `tournamentId: string;`), and destructure it in the function signature:

```ts
export function MatchCompareGrid({
  matchId,
  tournamentId,
  lang,
  startupA,
  startupB,
  initialVotesA,
  initialVotesB,
  initialVoted = null,
  backHref,
  dict,
}: {
  matchId: string;
  tournamentId: string;
  lang: string;
  startupA: CompareSide;
  startupB: CompareSide;
  initialVotesA: number;
  initialVotesB: number;
  initialVoted?: "A" | "B" | null;
  backHref?: string;
  dict: Dictionary["match"];
}) {
```

- [ ] **Step 3: Initialize the router**

Inside the component body, right after the existing `useState` declarations (after the `bumped` state line), add:

```ts
  const router = useRouter();
```

- [ ] **Step 4: Navigate after a successful vote**

Find `castVote`'s success path:

```ts
      setVoted(side);
      if (side === "A") setVotesA((v) => v + 1);
      else setVotesB((v) => v + 1);
      setBumped(side);
      setTimeout(() => setBumped(null), 500);
```

Replace it with (reads `nextMatchId` from the parsed response, navigates after the same delay used to clear the bump animation):

```ts
      const json = await res.json();
      setVoted(side);
      if (side === "A") setVotesA((v) => v + 1);
      else setVotesB((v) => v + 1);
      setBumped(side);
      setTimeout(() => {
        setBumped(null);
        if (json.nextMatchId) {
          router.push(`/${lang}/tournament/${tournamentId}/match/${json.nextMatchId}`);
        } else if (backHref) {
          router.push(backHref);
        }
      }, 500);
```

Note: this replaces the earlier `if (!res.ok) { ... return; }` block's sibling success path — the `res.json()` call must move here since the failure branch above already consumes the response body separately via its own `.json().catch(...)`. Double-check the full updated function reads:

```ts
  async function castVote(side: "A" | "B") {
    if (!token || pending || voted) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, side, turnstileToken: token }),
      });
      setPending(false);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? dict.voteFailed);
        return;
      }
      const json = await res.json();
      setVoted(side);
      if (side === "A") setVotesA((v) => v + 1);
      else setVotesB((v) => v + 1);
      setBumped(side);
      setTimeout(() => {
        setBumped(null);
        if (json.nextMatchId) {
          router.push(`/${lang}/tournament/${tournamentId}/match/${json.nextMatchId}`);
        } else if (backHref) {
          router.push(backHref);
        }
      }, 500);
    } catch {
      setPending(false);
      setError(dict.networkError);
    }
  }
```

- [ ] **Step 5: Run the linter and build**

Run: `npm run lint`
Expected: no errors on either modified file.

Run: `npm run build`
Expected: build succeeds (this catches the prop-type mismatch if `lang` was missed anywhere `MatchCompareGrid` is used).

- [ ] **Step 6: Manual verification**

Run: `npm run dev`

With a live tournament seeded with at least 2 live matches in the same round:
1. Sign in with a non-participant test account.
2. Vote on the first live matchup. Confirm the ✓ + vote-bump animation plays, then the page automatically navigates to the next live matchup in the round within ~500ms.
3. Vote on that one too. Confirm a fresh Turnstile challenge loads (proves the component remounted).
4. Vote in every remaining live matchup in the round. After the last one, confirm it navigates back to `/{lang}/tournament/{id}` (the bracket view).
5. Sign in with a test account that owns a Startup in this tournament. Confirm voting still gets rejected (403) and nothing navigates — auto-advance never engages for participants.

- [ ] **Step 7: Commit**

```bash
git add components/tournament/MatchCompareGrid.tsx "app/[lang]/tournament/[id]/match/[matchId]/page.tsx"
git commit -m "feat: auto-advance to the next unvoted matchup after voting"
```
