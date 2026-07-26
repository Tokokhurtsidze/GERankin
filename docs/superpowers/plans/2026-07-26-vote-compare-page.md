# Vote Compare Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline Turnstile+vote flow inside `MatchCard` (currently unusable without Turnstile env vars) with a dedicated `/tournament/[id]/match/[matchId]` page showing both startups' full profiles side by side, and make bot verification degrade gracefully when unconfigured everywhere it's checked.

**Architecture:** Three independent layers (client widget, server verify function, API route) each skip the Turnstile check when their respective env var is unset, so voting works end-to-end with zero config and re-activates automatically once real keys are added. The vote-casting UI moves out of `MatchCard`'s inline expand-in-place into a new full-width `MatchVotePicker` client component, mounted on a new server-rendered compare page that reuses the same profile pieces (`LiveWebsitePreview`, `OutboundLink`) as the existing `/startup/[id]` page.

**Tech Stack:** Next.js 16 App Router, React 19, Mongoose, Tailwind v4. No test runner is configured in this repo (no `test` script, no `.test.ts` files outside `node_modules`) — verification is manual against the real dev server and MongoDB, matching the existing convention for `lib/bracket/generate.ts` and `lib/bracket/tiebreak.ts`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-26-vote-compare-page-design.md` — this plan implements it in full; refer back to it for rationale.
- No changes to vote-counting logic, tie-break rules, or `Vote`/`Match`/`Startup` schemas.
- `Match Card`'s Share and Timeline behavior must not change — only the Vote button's target.
- Turnstile config gating uses exactly these two env vars, matching what's already referenced elsewhere in the codebase: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client, in `TurnstileWidget`) and `TURNSTILE_SECRET_KEY` (server, in `lib/turnstile/verify.ts`).
- The dev server the user runs manually is on `http://localhost:3000` (PID owned by the user's own terminal, not started by the implementer) — verification steps assume that server is already running and picks up file changes via Fast Refresh; only `next.config.ts` edits would need a manual restart, and this plan makes none.

---

### Task 1: Turnstile skip-when-unconfigured

**Files:**
- Modify: `lib/turnstile/verify.ts`
- Modify: `components/tournament/TurnstileWidget.tsx`
- Modify: `app/api/vote/route.ts`

**Interfaces:**
- Consumes: nothing new — `verifyTurnstileToken(token: string, ip: string): Promise<boolean>` (existing signature, unchanged), `TurnstileWidget({ onVerify }: { onVerify: (token: string | null) => void })` (existing signature, unchanged).
- Produces: same signatures as today, just with unconfigured-skip behavior added. No downstream task depends on new exports from this task — `VoteButtons`/`MatchVotePicker` keep using `TurnstileWidget` exactly as before.

- [ ] **Step 1: Update `lib/turnstile/verify.ts` to skip when `TURNSTILE_SECRET_KEY` is unset**

Replace the full file with:

```ts
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
```

- [ ] **Step 2: Update `components/tournament/TurnstileWidget.tsx` to auto-verify when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset**

Replace the `if (!SITE_KEY)` branch (and add the effect above it) so the full file reads:

```tsx
"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; theme?: "light" | "dark" | "auto" }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Cloudflare Turnstile challenge — required before a vote is accepted (anti-bot). */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !SITE_KEY || !window.turnstile) return;
    window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "auto",
      callback: (token) => onVerify(token),
    });
  }, [scriptReady, onVerify]);

  useEffect(() => {
    if (!SITE_KEY) onVerify("skipped");
  }, [onVerify]);

  if (!SITE_KEY) {
    return <p className="text-xs text-text-muted">Bot verification skipped (not configured).</p>;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
    </>
  );
}
```

- [ ] **Step 3: Update `app/api/vote/route.ts` so `turnstileToken` is optional and only checked when configured**

In the same file, change the schema and the check:

```ts
const bodySchema = z.object({
  matchId: z.string().min(1),
  side: z.enum(["A", "B"]),
  turnstileToken: z.string().optional(),
});
```

```ts
  // Anti-bot: Turnstile challenge + verified-email gate, both required before a vote counts
  // (Turnstile check is skipped automatically when TURNSTILE_SECRET_KEY isn't configured).
  if (process.env.TURNSTILE_SECRET_KEY) {
    const turnstileOk = await verifyTurnstileToken(turnstileToken ?? "", ip);
    if (!turnstileOk) {
      return NextResponse.json({ error: "Bot verification failed" }, { status: 403 });
    }
  }
```

(This replaces the existing unconditional `const turnstileOk = ...` / `if (!turnstileOk)` block — leave everything else in the file, including the `const { matchId, side, turnstileToken } = parsed.data;` destructure above it, unchanged.)

- [ ] **Step 4: Verify manually against the existing (still inline) vote flow**

The list view still has the old inline expand-to-vote UI at this point (Task 3 changes that) — use it to verify this task in isolation:

1. Confirm `.env.local` has no `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` lines (it doesn't, per earlier session state).
2. Open `http://localhost:3000/en/tournament/<id>` for the in-progress tournament (id `6a660ac7162bff8e3ebd3d7c` from this session, round 1, still live).
3. Click **Vote** on a live match card. Previously this showed "Bot verification not configured..." with both name-buttons permanently disabled. Now it should show "Bot verification skipped (not configured)." with both name-buttons **enabled** immediately.
4. Click one of the name-buttons. Confirm it either succeeds (button area replaces with "Vote cast for {name}") or — if you've already voted as this user in this match this session — shows "You already voted in this match", proving the request reached the server and was evaluated past the Turnstile gate rather than being blocked client-side.

- [ ] **Step 5: Commit**

```bash
git add lib/turnstile/verify.ts components/tournament/TurnstileWidget.tsx app/api/vote/route.ts
git commit -m "feat: skip Turnstile check when not configured"
```

---

### Task 2: Vote compare page (new route, new components)

**Files:**
- Create: `components/tournament/MatchVotePicker.tsx`
- Create: `components/tournament/MatchVoteSection.tsx`
- Create: `app/[lang]/tournament/[id]/match/[matchId]/page.tsx`

**Interfaces:**
- Consumes: `TurnstileWidget` (from Task 1, unchanged signature), `VoteBar` (existing, `{ votesA: number; votesB: number }`), `LiveWebsitePreview` (existing, `{ url: string; alt: string }`), `OutboundLink` (existing, `{ startupId: string; tournamentId: string; href: string; source: "card" | "showcase" | "slides" | "leaderboard"; children: React.ReactNode }`), `Match` / `Startup` models (existing).
- Produces: `MatchVotePicker({ matchId: string; nameA: string; nameB: string; onVoted: (side: "A" | "B") => void })` and `MatchVoteSection({ matchId: string; nameA: string; nameB: string; initialVotesA: number; initialVotesB: number })` — both consumed by Task 2's own page only; no other task imports them.

- [ ] **Step 1: Create `components/tournament/MatchVotePicker.tsx`**

```tsx
"use client";

import { useState } from "react";
import { TurnstileWidget } from "./TurnstileWidget";

export function MatchVotePicker({
  matchId,
  nameA,
  nameB,
  onVoted,
}: {
  matchId: string;
  nameA: string;
  nameB: string;
  onVoted: (side: "A" | "B") => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<"A" | "B" | null>(null);

  async function castVote(side: "A" | "B") {
    if (!token) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, side, turnstileToken: token }),
    });
    setPending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Vote failed");
      return;
    }
    setVoted(side);
    onVoted(side);
  }

  if (voted) {
    return <p className="text-sm font-semibold text-accent">Vote cast for {voted === "A" ? nameA : nameB}</p>;
  }

  return (
    <div className="ink-border flex flex-col gap-3 rounded-lg bg-surface p-4">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <TurnstileWidget onVerify={setToken} />
      <div className="flex gap-2">
        <button
          disabled={!token || pending}
          onClick={() => castVote("A")}
          className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {nameA}
        </button>
        <button
          disabled={!token || pending}
          onClick={() => castVote("B")}
          className="ink-border flex-1 rounded-md bg-bg px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {nameB}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/tournament/MatchVoteSection.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `app/[lang]/tournament/[id]/match/[matchId]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db/connect";
import { Match } from "@/lib/db/models";
import { LiveWebsitePreview } from "@/components/tournament/LiveWebsitePreview";
import { OutboundLink } from "@/components/tournament/OutboundLink";
import { MatchVoteSection } from "@/components/tournament/MatchVoteSection";
import { EmptyState } from "@/components/ui/EmptyState";

interface ProfileSide {
  _id: unknown;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  owner?: { name?: string };
}

function toProfile(raw: unknown): ProfileSide | undefined {
  const side = raw as ProfileSide | undefined;
  if (!side?.name) return undefined;
  return side;
}

function ProfileColumn({
  side,
  tournamentId,
  locale,
}: {
  side: ProfileSide;
  tournamentId: string;
  locale: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{side.name}</h2>
        <p className="mt-1 text-text-muted">{side.tagline}</p>
      </div>

      <div className="ink-border hard-shadow-sm h-64 overflow-hidden rounded-xl sm:h-72">
        <LiveWebsitePreview url={side.websiteUrl} alt={side.name} />
      </div>

      <p className="whitespace-pre-line text-sm text-text-muted">{side.description}</p>

      <OutboundLink startupId={String(side._id)} tournamentId={tournamentId} href={side.websiteUrl} source="card">
        Visit {side.name} →
      </OutboundLink>
    </div>
  );
}

export default async function MatchVotePage({
  params,
}: {
  params: Promise<{ lang: string; id: string; matchId: string }>;
}) {
  const { lang, id, matchId } = await params;

  try {
    await dbConnect();
  } catch {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load this match." />
      </section>
    );
  }

  const match = await Match.findById(matchId)
    .populate([
      { path: "startupA", select: "name tagline description logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
      { path: "startupB", select: "name tagline description logoUrl websiteUrl owner", populate: { path: "owner", select: "name" } },
    ])
    .lean();

  if (!match) notFound();

  const startupA = toProfile(match.startupA);
  const startupB = toProfile(match.startupB);
  const backHref = `/${lang}/tournament/${id}`;

  if (!startupA || !startupB) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">This match isn&apos;t ready to vote on yet</h1>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to round
        </Link>
      </section>
    );
  }

  if (match.status !== "live" && match.status !== "overtime") {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Voting isn&apos;t open for this match</h1>
        <p className="mt-2 text-text-muted">This round has already closed.</p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to round
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <ProfileColumn side={startupA} tournamentId={id} locale={lang} />
        <ProfileColumn side={startupB} tournamentId={id} locale={lang} />
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <MatchVoteSection
          matchId={matchId}
          nameA={startupA.name}
          nameB={startupB.name}
          initialVotesA={match.votesA}
          initialVotesB={match.votesB}
        />
      </div>

      <Link href={backHref} className="mx-auto mt-6 block text-center text-sm font-semibold text-accent hover:underline">
        ← Back to round
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Verify manually**

1. From the DB dump in this session, round 1 of tournament `6a660ac7162bff8e3ebd3d7c` has two live matches: `6a661a5d9f9dfa09757d1a63` and `6a661a5d9f9dfa09757d1a64`. Open `http://localhost:3000/en/tournament/6a660ac7162bff8e3ebd3d7c/match/6a661a5d9f9dfa09757d1a63` directly (this route isn't linked from anywhere yet — that's Task 3).
2. Confirm both startups render full profiles: name, tagline, live website preview (or its Microlink screenshot fallback if the site blocks iframing), description, "Visit {name} →" button.
3. Confirm the vote bar and picker render below both columns, Turnstile shows "skipped" (per Task 1), both name-buttons are clickable.
4. Cast a vote for one side. Confirm the picker replaces itself with "Vote cast for {name}" and the vote bar above it updates immediately (one side's count +1) without a page reload.
5. Reload the page. Confirm `votesA`/`votesB` in the DB actually incremented (cross-check with the `node -e` Mongo query pattern used earlier this session, or just trust the re-rendered `VoteBar` reflecting the server value now).
6. Try voting again as the same user (reload, attempt again) — confirm "You already voted in this match" surfaces.
7. Visit a `matchId` that belongs to a `pending`/non-live match (e.g. the round-2 match `6a661a5d9f9dfa09757d1a65` from this session's DB state, which has no startups assigned yet) — confirm the "This match isn't ready to vote on yet" message renders instead of crashing.

- [ ] **Step 5: Commit**

```bash
git add components/tournament/MatchVotePicker.tsx components/tournament/MatchVoteSection.tsx "app/[lang]/tournament/[id]/match/[matchId]/page.tsx"
git commit -m "feat: add dedicated vote-compare page"
```

---

### Task 3: Wire the round list to the new page

**Files:**
- Modify: `components/tournament/VoteButtons.tsx`
- Modify: `components/tournament/MatchCard.tsx`
- Modify: `components/tournament/LiveBracketSection.tsx:58`
- Modify: `app/[lang]/tournament/[id]/page.tsx:131`

**Interfaces:**
- Consumes: `MatchVotePicker`/`MatchVoteSection` are NOT used here — this task only changes navigation, not voting logic. Depends on Task 2's route existing at `/${locale}/tournament/${tournamentId}/match/${matchId}`.
- Produces: `VoteButtons({ locale: string; tournamentId: string; matchId: string; canVote: boolean })` (signature change — old signature was `{ matchId, nameA, nameB, canVote }`), `MatchCard` gains a new required prop `tournamentId: string`. Nothing outside this task consumes either.

This task changes four files together rather than splitting `MatchCard`'s new prop from its two call sites: `MatchCard` alone with the new required prop would leave both call sites failing to typecheck, so there's no point where a reviewer could accept part of this without the rest.

- [ ] **Step 1: Replace `components/tournament/VoteButtons.tsx`**

```tsx
"use client";

import Link from "next/link";

export function VoteButtons({
  locale,
  tournamentId,
  matchId,
  canVote,
}: {
  locale: string;
  tournamentId: string;
  matchId: string;
  canVote: boolean;
}) {
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: "Startup Clash GE", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex gap-2">
      <Link
        href={canVote ? `/${locale}/tournament/${tournamentId}/match/${matchId}` : "#"}
        aria-disabled={!canVote}
        className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold text-white ${
          canVote ? "bg-accent hover:bg-accent-hover" : "pointer-events-none cursor-not-allowed bg-accent opacity-40"
        }`}
      >
        Vote
      </Link>
      <button onClick={handleShare} className="ink-border rounded-md bg-surface px-4 py-2 text-sm font-semibold">
        Share
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `components/tournament/MatchCard.tsx`**

Change the function signature and the `interactive` block. The full file becomes:

```tsx
import Image from "next/image";
import Link from "next/link";
import { VoteBar } from "./VoteBar";
import { VoteButtons } from "./VoteButtons";
import { MatchTimeline } from "./MatchTimeline";

export interface MatchCardSide {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  ownerName?: string;
}

export interface MatchCardData {
  id: string;
  startupA?: MatchCardSide;
  startupB?: MatchCardSide;
  votesA: number;
  votesB: number;
  status: string;
  winner?: string;
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SideBlock({ side, locale }: { side?: MatchCardSide; locale: string }) {
  if (!side) {
    return <div className="flex flex-1 items-center gap-3 text-text-muted">TBD</div>;
  }
  return (
    <Link href={`/${locale}/startup/${side.id}`} className="flex flex-1 items-center gap-3">
      <Image
        src={side.logoUrl}
        alt={side.name}
        width={40}
        height={40}
        className="ink-border h-10 w-10 shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold">{side.name}</p>
        <p className="truncate text-xs text-text-muted">{domainOf(side.websiteUrl)}</p>
        {side.ownerName && <p className="truncate text-xs text-text-muted">{side.ownerName}</p>}
      </div>
    </Link>
  );
}

export function MatchCard({
  match,
  locale,
  tournamentId,
  interactive,
}: {
  match: MatchCardData;
  locale: string;
  tournamentId: string;
  interactive: boolean;
}) {
  return (
    <div className="ink-border hard-shadow-sm rounded-xl bg-surface p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SideBlock side={match.startupA} locale={locale} />
        <span className="px-2 text-xs font-semibold uppercase text-text-muted">vs</span>
        <SideBlock side={match.startupB} locale={locale} />
      </div>

      <div className="mt-4">
        <VoteBar votesA={match.votesA} votesB={match.votesB} />
      </div>

      {match.status === "overtime" && (
        <p className="font-mono-score mt-2 text-center text-xs font-semibold uppercase text-accent">Overtime</p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MatchTimeline matchId={match.id} label="Timeline" />
        {interactive && match.startupA && match.startupB && (
          <div className="sm:w-56">
            <VoteButtons
              locale={locale}
              tournamentId={tournamentId}
              matchId={match.id}
              canVote={match.status === "live" || match.status === "overtime"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `components/tournament/LiveBracketSection.tsx`**

Change line 58 from:

```tsx
        <MatchCard key={m.id} match={m} locale={locale} interactive />
```

to:

```tsx
        <MatchCard key={m.id} match={m} locale={locale} tournamentId={tournament._id.toString()} interactive />
```

(`tournament` is already in scope — it's the function's own parameter, already null-checked at the top of the function before this line is reached.)

- [ ] **Step 4: Update `app/[lang]/tournament/[id]/page.tsx`**

Change line 131 from:

```tsx
            <MatchCard key={m.id} match={m} locale={lang} interactive={tournament.status === "in_progress"} />
```

to:

```tsx
            <MatchCard key={m.id} match={m} locale={lang} tournamentId={id} interactive={tournament.status === "in_progress"} />
```

(`id` is already in scope from the destructured `params` at the top of the function.)

- [ ] **Step 5: Verify manually — full regression pass**

1. Run `npx tsc --noEmit -p tsconfig.json` from `D:\Desktop\GERankin`. Expect **zero** errors.
2. Open `http://localhost:3000/en` (homepage). Confirm the "Live matchups" bracket section still renders the two live matches from tournament `6a660ac7162bff8e3ebd3d7c` with working Vote/Share buttons.
3. Click **Vote** on a match card here. Confirm it navigates to `/en/tournament/6a660ac7162bff8e3ebd3d7c/match/<that match's id>` and the compare page loads correctly.
4. Open `http://localhost:3000/en/tournament/6a660ac7162bff8e3ebd3d7c` directly. Confirm the round-1 match cards there also link to the same compare page, and clicking **Share** still works (native share sheet or clipboard copy, unchanged from before).
5. Confirm `MatchTimeline`'s "Timeline +" expand/comment-post behavior on a match card is unaffected (unrelated to this feature, should still work exactly as before).
6. Confirm a match with `interactive={false}` (e.g. reload after the round ends, or check a `completed` tournament if one exists) shows no Vote/Share row at all — same as before this feature (unchanged existing guard: `interactive && match.startupA && match.startupB`).

- [ ] **Step 6: Commit**

```bash
git add components/tournament/VoteButtons.tsx components/tournament/MatchCard.tsx components/tournament/LiveBracketSection.tsx "app/[lang]/tournament/[id]/page.tsx"
git commit -m "feat: point MatchCard's Vote button at the compare page"
```
