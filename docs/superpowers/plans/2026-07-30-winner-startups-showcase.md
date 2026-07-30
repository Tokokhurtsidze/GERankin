# Winner Startups Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only Hall of Fame list (shown on the homepage's `#leaderboard` section and the standalone `/[lang]/leaderboard` page) with a layout where winner-startup logos flank a center content block — one column when there's a single winner, two columns (left/right) when there are several — each logo linking out to that startup's website. Give admins a way to remove a startup from this showcase without deleting the underlying tournament.

**Architecture:** A pure helper (`splitWinnerColumns`) decides left/right placement given an ordered list of winners — unit-tested in isolation. A new query (`getWinnerStartups`) fetches completed tournaments' champions with the fields the showcase needs (logo, website, name). A single shared component (`WinnerStartupsSection`) owns the grid layout and renders both columns around caller-supplied center content (`children`), so both pages that currently render `HallOfFame` swap to it with minimal changes. Admin gets a new `PATCH` endpoint that unsets a tournament's `champion` field, plus a confirm-dialog button mirroring the existing `DeleteTournamentButton` pattern.

**Tech Stack:** Next.js 16 App Router (Server Components + Route Handlers), Mongoose, Tailwind CSS, Vitest.

## Global Constraints

- No schema changes — `Tournament.champion` stays a single optional `ObjectId` ref (per spec).
- "Remove from showcase" only unsets `Tournament.champion`; it must never delete the `Startup`, `Tournament`, `Match`, or `Vote` documents (per spec — that's the existing `DeleteTournamentButton` flow, untouched).
- No tournament-name caption under logo tiles — logo is the only visible content, click → `websiteUrl` in a new tab (per user confirmation).
- Keep the existing intro heading/eyebrow text exactly as it reads today on both pages — only its layout position changes (per user confirmation).
- Follow existing codebase conventions: colocated `*.test.ts` next to the module it tests (see `lib/bracket/next-match.test.ts`), try/catch-return-null for DB-unavailable states (see `HallOfFame.loadPastTournaments`), admin auth check `session?.user.role !== "admin"` (see `DELETE` handler in `app/api/admin/tournaments/[id]/route.ts`).

---

### Task 1: Pure column-splitting helper

**Files:**
- Create: `lib/tournament/winner-showcase.ts`
- Test: `lib/tournament/winner-showcase.test.ts`

**Interfaces:**
- Produces: `interface WinnerStartup { id: string; name: string; logoUrl: string; websiteUrl: string }` and `function splitWinnerColumns(winners: WinnerStartup[]): { left: WinnerStartup[]; right: WinnerStartup[] }` — both imported by Task 2 (`lib/tournament/queries.ts`) and Task 3 (`components/marketing/WinnerStartupsSection.tsx`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/tournament/winner-showcase.test.ts
import { describe, it, expect } from "vitest";
import { splitWinnerColumns, type WinnerStartup } from "./winner-showcase";

function winner(id: string): WinnerStartup {
  return { id, name: `Startup ${id}`, logoUrl: `https://example.com/${id}.png`, websiteUrl: `https://${id}.example.com` };
}

describe("splitWinnerColumns", () => {
  it("returns empty columns for no winners", () => {
    expect(splitWinnerColumns([])).toEqual({ left: [], right: [] });
  });

  it("puts a single winner on the left", () => {
    const w = winner("a");
    expect(splitWinnerColumns([w])).toEqual({ left: [w], right: [] });
  });

  it("alternates left/right starting with left for two winners", () => {
    const a = winner("a");
    const b = winner("b");
    expect(splitWinnerColumns([a, b])).toEqual({ left: [a], right: [b] });
  });

  it("gives the left column the extra item on an odd total", () => {
    const [a, b, c] = ["a", "b", "c"].map(winner);
    expect(splitWinnerColumns([a, b, c])).toEqual({ left: [a, c], right: [b] });
  });

  it("preserves input order within each column", () => {
    const [a, b, c, d, e] = ["a", "b", "c", "d", "e"].map(winner);
    expect(splitWinnerColumns([a, b, c, d, e])).toEqual({ left: [a, c, e], right: [b, d] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/tournament/winner-showcase.test.ts`
Expected: FAIL — `lib/tournament/winner-showcase.ts` does not exist (`Cannot find module './winner-showcase'`).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/tournament/winner-showcase.ts
export interface WinnerStartup {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
}

/** Splits an ordered winners list into two display columns: even indices
 *  (most-recent-first order) go left, odd go right, so a single winner
 *  lands on the left and an odd total leaves the left column one ahead. */
export function splitWinnerColumns(winners: WinnerStartup[]): {
  left: WinnerStartup[];
  right: WinnerStartup[];
} {
  const left: WinnerStartup[] = [];
  const right: WinnerStartup[] = [];
  winners.forEach((winner, index) => {
    (index % 2 === 0 ? left : right).push(winner);
  });
  return { left, right };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/tournament/winner-showcase.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/tournament/winner-showcase.ts lib/tournament/winner-showcase.test.ts
git commit -m "feat: add splitWinnerColumns helper for the winner startups showcase"
```

---

### Task 2: `getWinnerStartups` data query

**Files:**
- Modify: `lib/tournament/queries.ts`

**Interfaces:**
- Consumes: `WinnerStartup` type from `lib/tournament/winner-showcase.ts` (Task 1).
- Produces: `async function getWinnerStartups(): Promise<WinnerStartup[] | null>` — `null` means DB unavailable (mirrors `getActiveTournament`'s callers using `.catch(() => null)`, but this function catches internally like `HallOfFame.loadPastTournaments` used to). Consumed by Task 4 (`app/[lang]/page.tsx`) and Task 5 (`app/[lang]/leaderboard/page.tsx`).

- [ ] **Step 1: Add the query function**

Add to `lib/tournament/queries.ts` (keep existing imports/functions untouched, just add this import and function):

```ts
import type { WinnerStartup } from "@/lib/tournament/winner-showcase";
```

```ts
/** All completed tournaments' champions, most-recent first, for the
 *  winner-startups showcase (homepage + /leaderboard). Returns null if
 *  the DB is unavailable, mirroring HallOfFame's previous behavior. */
export async function getWinnerStartups(): Promise<WinnerStartup[] | null> {
  try {
    await dbConnect();
    const tournaments = await Tournament.find({ status: "completed", champion: { $ne: null } })
      .sort({ updatedAt: -1 })
      .populate({ path: "champion", select: "name logoUrl websiteUrl" })
      .lean();

    type PopulatedChampion = { _id: { toString(): string }; name: string; logoUrl: string; websiteUrl: string };

    return tournaments
      .map((t) => t.champion as unknown as PopulatedChampion | undefined)
      .filter((champion): champion is PopulatedChampion => Boolean(champion))
      .map((champion) => ({
        id: champion._id.toString(),
        name: champion.name,
        logoUrl: champion.logoUrl,
        websiteUrl: champion.websiteUrl,
      }));
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from `lib/tournament/queries.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/tournament/queries.ts
git commit -m "feat: add getWinnerStartups query for the winner startups showcase"
```

---

### Task 3: `WinnerStartupsSection` component (replaces `HallOfFame`)

**Files:**
- Create: `components/marketing/WinnerStartupsSection.tsx`

**Interfaces:**
- Consumes: `WinnerStartup`, `splitWinnerColumns` from `lib/tournament/winner-showcase.ts` (Task 1); `Dictionary` type from `@/lib/i18n/get-dictionary`; `EmptyState` from `@/components/ui/EmptyState`.
- Produces: `function WinnerStartupsSection({ winners, dict, children }: { winners: WinnerStartup[] | null; dict: Dictionary; children: ReactNode }): JSX.Element` — consumed by Task 4 and Task 5.

- [ ] **Step 1: Write the component**

```tsx
// components/marketing/WinnerStartupsSection.tsx
import Image from "next/image";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { splitWinnerColumns, type WinnerStartup } from "@/lib/tournament/winner-showcase";

function WinnerColumn({ winners }: { winners: WinnerStartup[] }) {
  return (
    <div className="flex flex-row flex-wrap justify-center gap-3 sm:flex-col sm:items-center">
      {winners.map((winner) => (
        <a
          key={winner.id}
          href={winner.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ink-border block h-14 w-14 shrink-0 overflow-hidden rounded-lg"
        >
          <Image
            src={winner.logoUrl}
            alt={winner.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}

export function WinnerStartupsSection({
  winners,
  dict,
  children,
}: {
  winners: WinnerStartup[] | null;
  dict: Dictionary;
  children: ReactNode;
}) {
  if (winners === null) {
    return (
      <div className="flex flex-col gap-6">
        {children}
        <EmptyState title="Database not connected" message={dict.leaderboard.dbNotConnectedBody} />
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {children}
        <p className="text-center text-text-muted">{dict.leaderboard.noCompleted}</p>
      </div>
    );
  }

  const { left, right } = splitWinnerColumns(winners);

  return (
    <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1fr_minmax(0,2fr)_1fr] sm:gap-10">
      <div className="sm:order-2">{children}</div>
      <div className="sm:order-1">
        <WinnerColumn winners={left} />
      </div>
      {right.length > 0 && (
        <div className="sm:order-3">
          <WinnerColumn winners={right} />
        </div>
      )}
    </div>
  );
}
```

Note on the grid ordering: DOM order is center → left → right, so on mobile (`grid-cols-1`, no `order` overrides) the intro text stacks on top and the columns stack below it. At `sm` and up, `sm:order-*` repositions them into left/center/right across the three grid columns — matching the wireframe without duplicating markup per breakpoint.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/WinnerStartupsSection.tsx
git commit -m "feat: add WinnerStartupsSection component"
```

---

### Task 4: Wire into the homepage `#leaderboard` section

**Files:**
- Modify: `app/[lang]/page.tsx`

**Interfaces:**
- Consumes: `getWinnerStartups` (Task 2), `WinnerStartupsSection` (Task 3).

- [ ] **Step 1: Swap the import**

In `app/[lang]/page.tsx`, remove:

```ts
import { HallOfFame } from "@/components/marketing/HallOfFame";
```

Add this new import line:

```ts
import { WinnerStartupsSection } from "@/components/marketing/WinnerStartupsSection";
```

And change the existing tournament-queries import line from:

```ts
import { getActiveTournament, getReigningChampion, getFounderCount } from "@/lib/tournament/queries";
```

to:

```ts
import { getActiveTournament, getReigningChampion, getFounderCount, getWinnerStartups } from "@/lib/tournament/queries";
```

- [ ] **Step 2: Fetch winners alongside the other homepage data**

Change:

```ts
const [tournament, champion, founderCount] = await Promise.all([
  getActiveTournament().catch(() => null),
  getReigningChampion().catch(() => null),
  getFounderCount().catch(() => 0),
]);
```

to:

```ts
const [tournament, champion, founderCount, winners] = await Promise.all([
  getActiveTournament().catch(() => null),
  getReigningChampion().catch(() => null),
  getFounderCount().catch(() => 0),
  getWinnerStartups(),
]);
```

(`getWinnerStartups` already catches internally and resolves to `null` on failure — no extra `.catch()` needed.)

- [ ] **Step 3: Replace the leaderboard section markup**

Replace:

```tsx
{/* Leaderboard */}
<section id="leaderboard" className={SLIDE_CLASS}>
  <div className="w-full max-w-2xl">
    <div className="reveal-up">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
        {dict.nav.winners}
      </p>
      <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.leaderboard.heading}</h2>
    </div>
    <div className="mt-10">
      <HallOfFame dict={dict} />
    </div>
  </div>
</section>
```

with:

```tsx
{/* Leaderboard */}
<section id="leaderboard" className={SLIDE_CLASS}>
  <div className="w-full max-w-4xl">
    <WinnerStartupsSection winners={winners} dict={dict}>
      <div className="reveal-up text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.winners}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">{dict.leaderboard.heading}</h2>
      </div>
    </WinnerStartupsSection>
  </div>
</section>
```

(Container widened from `max-w-2xl` to `max-w-4xl` so the three-column layout has room to breathe.)

- [ ] **Step 4: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/[lang]/page.tsx"
git commit -m "feat: show winner startups flanking the homepage leaderboard section"
```

---

### Task 5: Wire into the standalone `/leaderboard` page and remove `HallOfFame`

**Files:**
- Modify: `app/[lang]/leaderboard/page.tsx`
- Delete: `components/marketing/HallOfFame.tsx`

**Interfaces:**
- Consumes: `getWinnerStartups` (Task 2), `WinnerStartupsSection` (Task 3).

- [ ] **Step 1: Update `app/[lang]/leaderboard/page.tsx`**

Replace:

```tsx
import { HallOfFame } from "@/components/marketing/HallOfFame";
```

with:

```tsx
import { WinnerStartupsSection } from "@/components/marketing/WinnerStartupsSection";
import { getWinnerStartups } from "@/lib/tournament/queries";
```

Replace the page body:

```tsx
export default async function LeaderboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.winners}</p>
      <h1 className="mb-10 mt-2 text-center text-4xl font-bold tracking-tight">{dict.leaderboard.heading}</h1>
      <HallOfFame dict={dict} />
    </section>
  );
}
```

with:

```tsx
export default async function LeaderboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const winners = await getWinnerStartups();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <WinnerStartupsSection winners={winners} dict={dict}>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.winners}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{dict.leaderboard.heading}</h1>
        </div>
      </WinnerStartupsSection>
    </section>
  );
}
```

(Container widened from `max-w-4xl` to `max-w-5xl` for the same reason as Task 4.)

- [ ] **Step 2: Confirm nothing else imports `HallOfFame`**

Run: `grep -rn "HallOfFame" app components --include="*.tsx" --include="*.ts"`
Expected: no matches (both call sites were updated in Task 4 and this task's Step 1).

- [ ] **Step 3: Delete the now-unused component**

Delete `components/marketing/HallOfFame.tsx`.

- [ ] **Step 4: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/[lang]/leaderboard/page.tsx"
git rm components/marketing/HallOfFame.tsx
git commit -m "feat: show winner startups on the standalone leaderboard page"
```

---

### Task 6: Admin API — unset a tournament's champion

**Files:**
- Modify: `app/api/admin/tournaments/[id]/route.ts`

**Interfaces:**
- Produces: `PATCH /api/admin/tournaments/[id]` → `200 { ok: true }` on success, `401` non-admin, `400` invalid id, `404` tournament not found. Consumed by Task 7 (`RemoveChampionButton`).

- [ ] **Step 1: Add the PATCH handler**

Add to `app/api/admin/tournaments/[id]/route.ts`, after the existing `DELETE` export (the file already imports `auth`, `dbConnect`, `Tournament`, `objectIdString` — no new imports needed):

```ts
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!objectIdString.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const tournament = await Tournament.findByIdAndUpdate(id, { $unset: { champion: 1 } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Manually verify the endpoint**

There's no existing route-handler test harness in this codebase (all current tests are pure-function unit tests — see `lib/bracket/*.test.ts`), so verify this by hand against a real completed tournament once Task 7 wires up the button in Step's UI — or, if you want to check the route in isolation first, start the dev server and run:

```bash
npm run dev
```

Then, with an admin session cookie in the browser, use the browser devtools console on `/en/admin/tournaments` to run:

```js
fetch(location.origin + "/api/admin/tournaments/<a completed tournament id>", { method: "PATCH" }).then(r => r.json()).then(console.log)
```

Expected: `{ ok: true }`, and re-running `GET /api/admin/tournaments` shows that tournament's `champion` field gone.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/api/admin/tournaments/[id]/route.ts"
git commit -m "feat: add PATCH endpoint to remove a tournament's champion"
```

---

### Task 7: Admin UI — "Remove from showcase" button

**Files:**
- Create: `components/admin/RemoveChampionButton.tsx`
- Modify: `app/[lang]/admin/tournaments/page.tsx`

**Interfaces:**
- Consumes: `PATCH /api/admin/tournaments/[id]` (Task 6).
- Produces: `function RemoveChampionButton({ id, name }: { id: string; name: string }): JSX.Element`.

- [ ] **Step 1: Write `RemoveChampionButton`**

Model directly on `components/admin/DeleteTournamentButton.tsx`'s confirm-dialog pattern, but without the type-the-name gate (this action isn't destructive to data — it only clears a pointer):

```tsx
// components/admin/RemoveChampionButton.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveChampionButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleRemove() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/tournaments/${id}`, { method: "PATCH" });
    setPending(false);

    if (!res.ok) {
      const json: { error?: string } = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to remove champion");
      return;
    }
    closeDialog();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-bg"
      >
        Remove from showcase
      </button>

      <dialog
        ref={dialogRef}
        className="ink-border hard-shadow-sm w-full max-w-sm rounded-xl bg-surface p-6 backdrop:bg-black/40"
      >
        <h2 className="mb-2 text-lg font-semibold">Remove &ldquo;{name}&rdquo; from the winners showcase?</h2>
        <p className="mb-4 text-sm text-text-muted">
          This clears the champion for this tournament so it no longer appears on the homepage or leaderboard.
          The tournament, its matches, and its startups are not deleted.
        </p>
        {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-text-muted hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleRemove}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Removing..." : "Remove champion"}
          </button>
        </div>
      </dialog>
    </>
  );
}
```

- [ ] **Step 2: Wire it into the admin tournaments page**

In `app/[lang]/admin/tournaments/page.tsx`, add the import:

```ts
import { RemoveChampionButton } from "@/components/admin/RemoveChampionButton";
```

Replace:

```tsx
<div className="flex items-center gap-3">
  {t.status === "registration" && (
    <RegistrationCountdown closesAt={t.registrationClosesAt.toISOString()} />
  )}
  <DeleteTournamentButton id={t._id.toString()} name={t.name} />
</div>
```

with:

```tsx
<div className="flex items-center gap-3">
  {t.status === "registration" && (
    <RegistrationCountdown closesAt={t.registrationClosesAt.toISOString()} />
  )}
  {t.status === "completed" && t.champion && (
    <RemoveChampionButton id={t._id.toString()} name={t.name} />
  )}
  <DeleteTournamentButton id={t._id.toString()} name={t.name} />
</div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/RemoveChampionButton.tsx "app/[lang]/admin/tournaments/page.tsx"
git commit -m "feat: add admin control to remove a startup from the winners showcase"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `npx vitest run`
Expected: all test files pass, including the new `lib/tournament/winner-showcase.test.ts`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `rm -rf .next && npm run build`
Expected: compiles, type-checks, and generates all routes successfully (including `/[lang]`, `/[lang]/leaderboard`, `/[lang]/admin/tournaments`, `/api/admin/tournaments/[id]`).

- [ ] **Step 4: Manual browser check (required for this UI change per project convention)**

Run: `npm run dev`, then in a browser:
- Visit `/en` — scroll to the "Winners" (`#leaderboard`) section. With 0 completed tournaments, confirm the existing empty message still shows. With 1 completed tournament (set one up via `/en/admin/tournaments` and let it run to completion, or adjust a tournament to `status: "completed"` with a `champion` set directly in the DB for testing), confirm a single logo tile shows on the left of the heading and clicking it opens the startup's website in a new tab. Add a second and third completed tournament and confirm tiles distribute left/right around the heading, most-recent top-left.
- Visit `/en/leaderboard` and confirm the same layout renders there.
- Visit `/en/admin/tournaments` as an admin: confirm a "Remove from showcase" button appears next to "Delete" only for completed tournaments with a champion set, confirm the dialog text, and confirm clicking through removes the tile from both `/en` and `/en/leaderboard` after refresh, without deleting the tournament row itself.
- Resize the browser below the `sm` breakpoint and confirm the columns stack under the heading instead of flanking it.

- [ ] **Step 5: Update the design spec if manual testing surfaces a deviation**

If the manual check in Step 4 reveals a layout or behavior gap from `docs/superpowers/specs/2026-07-30-winner-startups-showcase-design.md`, fix the code (preferred) or, if the spec itself was wrong, amend the spec file and commit that separately — do not leave the two silently inconsistent.
