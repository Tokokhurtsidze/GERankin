# Footer Toggle, Home Animations, Hero Input, SEO Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the footer reachable from every page via a bottom-left toggle overlay, add scroll-reveal motion to the home page's still-bare sections, widen and restyle the hero input, and complete per-locale SEO (hreflang + Search Console verification slot).

**Architecture:** Four independent, sequential tasks against the existing Next.js 16 App Router codebase at `D:\Desktop\GERankin`. No new dependencies — reuses `framer-motion` (already installed, `^12.42.2`) for the footer overlay and the existing `.reveal-up` CSS utility (`app/globals.css:111-134`) for the bare home-page sections.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, framer-motion.

## Global Constraints

- No new npm dependencies — `framer-motion` is already a dependency; do not add anything else.
- Do not touch `HowItWorks.tsx`, `PricingPlans.tsx`, `Accordion.tsx` (FAQ), `FooterCtaBanner.tsx`, or `SlideDeck.tsx` — all already have their own framer-motion animation and are out of scope.
- Do not modify `app/globals.css` — the `.reveal-up` keyframes/media-query already exist and are reused as-is.
- Do not modify vote/tournament/auth business logic, the `Vote`/`Match`/`Startup` schemas, or any API route.
- After every task: `npx tsc --noEmit` and `npx eslint .` must both exit 0 before moving on.
- After the final task: `npx next build` and `npx vitest run` must both exit 0.
- Spec of record: `docs/superpowers/specs/2026-07-29-footer-toggle-animations-seo-design.md`.

---

### Task 1: Global footer toggle

**Files:**
- Create: `components/marketing/FooterToggle.tsx`
- Modify: `components/marketing/ConditionalFooter.tsx`
- Modify: `app/[lang]/page.tsx:17` (remove `SiteFooter` import), `app/[lang]/page.tsx:83` (remove `"footer"` section entry), `app/[lang]/page.tsx:223-226` (remove the footer `<section>` block)

**Interfaces:**
- Consumes: `SiteFooter` from `./SiteFooter` (unchanged — `{ locale: string; dict: Dictionary }` props, no prop changes needed), `HideOnFullscreenRoutes` from `@/components/ui/HideOnFullscreenRoutes` (unchanged), `Dictionary` type from `@/lib/i18n/get-dictionary`.
- Produces: `FooterToggle({ locale, dict }: { locale: string; dict: Dictionary })` — a client component rendering a fixed bottom-left toggle button plus an animated slide-up overlay containing `SiteFooter`. `ConditionalFooter` now renders `FooterToggle` on every route (still wrapped in `HideOnFullscreenRoutes`).

- [ ] **Step 1: Create `FooterToggle.tsx`**

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteFooter } from "./SiteFooter";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function FooterToggle({ locale, dict }: { locale: string; dict: Dictionary }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Hide footer" : "Show footer"}
        className="ink-border hard-shadow-sm fixed bottom-5 left-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text transition-colors hover:bg-border"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="footer-backdrop"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-bg/60 backdrop-blur-sm"
            />
            <motion.div
              key="footer-panel"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto bg-bg"
            >
              <SiteFooter locale={locale} dict={dict} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

Note the toggle button is `z-50`, the panel `z-40`, the backdrop `z-30` — the button always stays clickable above the panel so it can close it again, even though both are positioned near the bottom-left corner.

- [ ] **Step 2: Rewrite `ConditionalFooter.tsx`**

Replace the entire file with:

```tsx
import { HideOnFullscreenRoutes } from "@/components/ui/HideOnFullscreenRoutes";
import { FooterToggle } from "./FooterToggle";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Footer toggle on every route except ones that need the full viewport (the live match compare page). */
export function ConditionalFooter({ locale, dict }: { locale: string; dict: Dictionary }) {
  return (
    <HideOnFullscreenRoutes>
      <FooterToggle locale={locale} dict={dict} />
    </HideOnFullscreenRoutes>
  );
}
```

This drops the `"use client"` directive, the `usePathname` import, and the `HOME_ROUTE` regex/early-return entirely — none of that logic is needed anymore since the footer no longer excludes the home route.

- [ ] **Step 3: Remove the footer slide from the home page**

In `app/[lang]/page.tsx`:

1. Delete the `SiteFooter` import line (currently line 17: `import { SiteFooter } from "@/components/marketing/SiteFooter";`).
2. Delete the `{ id: "footer", label: "Footer" },` entry from the `sections` array (currently line 83, the last entry before the closing `];`).
3. Delete the entire footer section block:

```tsx
        {/* Footer, as the deck's final slide */}
        <section id="footer" className={`${SLIDE_CLASS} !justify-end !py-0`}>
          <SiteFooter locale={locale} dict={dict} />
        </section>
```

(This sits immediately before the closing `</SlideScroller>` tag — remove only this block, keep `</SlideScroller>`.)

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

Run: `npx eslint .`
Expected: exits 0, no errors.

- [ ] **Step 5: Manual verification in dev server**

Run: `npm run dev`, open `http://localhost:3000/en`.

- Confirm a small circular arrow button appears fixed in the bottom-left corner.
- Click it: a footer panel should slide up from the bottom with a dimmed backdrop behind it, arrow rotates 180°.
- Click the arrow again (or the backdrop): panel slides back down and disappears.
- Navigate to `/en/faq` (or any non-home page): confirm the same toggle button and behavior work there too.
- Navigate to a live match's vote-compare page (`/en/tournament/<id>/match/<matchId>` — only reachable if a tournament is `in_progress`; skip this check if none exists locally) and confirm the toggle button does NOT appear there.
- Scroll to the end of the home page's slide deck: confirm there is no longer a redundant static footer slide after "Full Bracket".

Stop the dev server once confirmed (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add components/marketing/FooterToggle.tsx components/marketing/ConditionalFooter.tsx "app/[lang]/page.tsx"
git commit -m "feat: turn the footer into a global bottom-left toggle overlay

Footer is now reachable from every page via a small floating arrow
button that slides up an overlay, instead of only existing as the
home page's final scroll-slide."
```

---

### Task 2: Home-page scroll-reveal animations

**Files:**
- Modify: `app/[lang]/page.tsx` (hero block + five section header pairs)
- Modify: `components/tournament/LiveBracketSection.tsx:55`
- Modify: `components/tournament/HomeBracketTree.tsx:40-50`

**Interfaces:**
- Consumes: the existing `.reveal-up` CSS class and `--reveal-index` custom property (`app/globals.css:111-134`) — no code changes to that file, just applying the class name to new elements.
- Produces: no new exports; purely presentational class additions to existing JSX.

- [ ] **Step 1: Add reveal-up to the hero block in `app/[lang]/page.tsx`**

Replace the hero section's inner JSX (currently lines 90-125, inside `<section id="hero" className={SLIDE_CLASS}>`) with:

```tsx
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="reveal-up text-xs font-semibold uppercase tracking-wide text-text-muted"
              style={{ "--reveal-index": 0 } as React.CSSProperties}
            >
              {dict.hero.eyebrow}
            </p>
            <h1
              className="reveal-up mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
              style={{ "--reveal-index": 1 } as React.CSSProperties}
            >
              {dict.hero.titleLine1} {dict.hero.titleLine2} {dict.hero.titleLine3}
            </h1>
            <p
              className="reveal-up mx-auto mt-5 max-w-xl text-base text-text-muted sm:text-lg"
              style={{ "--reveal-index": 2 } as React.CSSProperties}
            >
              {dict.hero.subtitle}
            </p>

            <div className="reveal-up mx-auto mt-8 max-w-2xl" style={{ "--reveal-index": 3 } as React.CSSProperties}>
              <HeroLaunchForm locale={locale} placeholder={dict.hero.urlPlaceholder} ctaLabel={dict.hero.cta} />
            </div>

            <div
              className="reveal-up mt-6 flex justify-center"
              style={{ "--reveal-index": 4 } as React.CSSProperties}
            >
              <AvatarCluster count={founderCount} joinWord={dict.hero.joinPrefix} label={dict.hero.joinCount} />
            </div>

            {champion && (
              <div
                className="reveal-up mx-auto mt-8 max-w-md"
                style={{ "--reveal-index": 5 } as React.CSSProperties}
              >
                <ChampionShowcase startup={champion.startup} dict={dict} locale={locale} />
              </div>
            )}

            {tournament?.status === "registration" && (
              <div
                className="reveal-up ink-border mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-xl bg-surface px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
                style={{ "--reveal-index": 6 } as React.CSSProperties}
              >
                <div>
                  <p className="font-semibold">{dict.registration.windowOpen}</p>
                  <p className="text-sm text-text-muted">
                    {tournament.entrants?.length ?? 0}/{tournament.maxEntrants} {dict.registration.capacity}
                  </p>
                </div>
                <RegistrationCountdown
                  closesAt={tournament.registrationClosesAt.toISOString()}
                  closingLabel={dict.registration.closing}
                />
              </div>
            )}
          </div>
```

Note the hero form wrapper's `max-w-lg` becomes `max-w-2xl` here as well — this is also required by Task 3, so it's already correct in the snippet above; if Task 3 is done first, don't revert it.

- [ ] **Step 2: Wrap the bracket section's header pair**

In `app/[lang]/page.tsx`, inside `<section id="bracket" className={SLIDE_CLASS}>`, replace:

```tsx
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.bracket}</p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.home.liveMatchups}</h2>
```

with:

```tsx
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.bracket}</p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.home.liveMatchups}</h2>
            </div>
```

- [ ] **Step 3: Wrap the slides section's header pair**

Inside `<section id="slides" className={SLIDE_CLASS}>`, replace:

```tsx
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
              {dict.nav.slides}
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.home.onTheRadar}</h2>
```

with:

```tsx
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.slides}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.home.onTheRadar}</h2>
            </div>
```

- [ ] **Step 4: Wrap the leaderboard section's header pair**

Inside `<section id="leaderboard" className={SLIDE_CLASS}>`, replace:

```tsx
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
              {dict.nav.winners}
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.leaderboard.heading}</h2>
```

with:

```tsx
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.winners}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.leaderboard.heading}</h2>
            </div>
```

(`HallOfFame`'s own internal `reveal-up` list items, rendered inside this same section, are untouched.)

- [ ] **Step 5: Wrap the pricing section's header pair**

Inside `<section id="pricing" className={SLIDE_CLASS}>`, replace:

```tsx
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
              {dict.nav.pricing}
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.pricing.heading}</h2>
```

with:

```tsx
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.pricing}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.pricing.heading}</h2>
            </div>
```

(`PricingPlans`' own framer-motion card reveal, rendered inside this same section, is untouched.)

- [ ] **Step 6: Wrap the FAQ section's header pair**

Inside `<section id="faq" className={SLIDE_CLASS}>`, replace:

```tsx
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
              {dict.nav.faq}
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.faq.heading}</h2>
```

with:

```tsx
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.faq}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.faq.heading}</h2>
            </div>
```

(`Accordion`'s own framer-motion item reveal, rendered inside this same section, is untouched.)

- [ ] **Step 7: Wrap the bracket-tree section's header pair**

Inside `<section id="bracket-tree" className={SLIDE_CLASS}>`, replace:

```tsx
            <p className="shrink-0 text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.bracket}</p>
            <h2 className="mt-2 shrink-0 text-center text-3xl font-bold tracking-tight">{dict.nav.fullBracket}</h2>
```

with:

```tsx
            <div className="reveal-up shrink-0">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.bracket}</p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.nav.fullBracket}</h2>
            </div>
```

(`shrink-0` moves from the two children onto the new wrapper, since this section is a flex column and the wrapper is now the flex item that must not shrink.)

- [ ] **Step 8: Add reveal-up to `LiveBracketSection`'s wrapper**

In `components/tournament/LiveBracketSection.tsx:55`, change:

```tsx
  return (
    <div className="flex flex-col gap-4">
```

to:

```tsx
  return (
    <div className="reveal-up flex flex-col gap-4">
```

- [ ] **Step 9: Add reveal-up to `HomeBracketTree`'s wrapper**

In `components/tournament/HomeBracketTree.tsx:40-50`, change:

```tsx
  return (
    <ScaleToFitBracket>
      <BracketTree
        tree={tree}
        locale={locale}
        tournamentId={tournament._id.toString()}
        dict={dict}
        interactive={false}
      />
    </ScaleToFitBracket>
  );
```

to:

```tsx
  return (
    <div className="reveal-up h-full w-full">
      <ScaleToFitBracket>
        <BracketTree
          tree={tree}
          locale={locale}
          tournamentId={tournament._id.toString()}
          dict={dict}
          interactive={false}
        />
      </ScaleToFitBracket>
    </div>
  );
```

The `h-full w-full` on the new wrapper is required — `ScaleToFitBracket` sizes itself relative to its parent via `h-full w-full`, and the parent in `app/[lang]/page.tsx` (`<div className="mt-6 min-h-0 flex-1">`) only stretches its immediate child. Without `h-full w-full` on this new wrapper, `ScaleToFitBracket` would collapse to zero height.

- [ ] **Step 10: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

Run: `npx eslint .`
Expected: exits 0, no errors.

- [ ] **Step 11: Manual verification in dev server**

Run: `npm run dev`, open `http://localhost:3000/en`.

- Scroll/snap through every home page section (hero, how it works, bracket, slides, leaderboard, pricing, FAQ, bracket-tree). Confirm each one's header text (and the hero's stacked elements) fades/rises in rather than appearing instantly.
- Confirm the bracket-tree section's bracket tree still fills its column and scales correctly (this is the step most likely to regress if the `h-full w-full` wrapper was done wrong) — it should look identical in size/position to before this change, just with a fade-in.
- Confirm nothing shifts layout unexpectedly (no content jumping after the animation completes).

Stop the dev server once confirmed (Ctrl+C).

- [ ] **Step 12: Commit**

```bash
git add "app/[lang]/page.tsx" components/tournament/LiveBracketSection.tsx components/tournament/HomeBracketTree.tsx
git commit -m "feat: add scroll-reveal animation to the home page's bare sections

Extends the existing .reveal-up CSS utility (already used by
HallOfFame) to the hero block, every section's header text, and the
two server-rendered bracket components — the only home-page pieces
that had no entry animation at all."
```

---

### Task 3: Hero input restyle

**Files:**
- Modify: `components/tournament/HeroLaunchForm.tsx`
- Modify: `app/[lang]/page.tsx` (hero form wrapper `max-w-lg` → `max-w-2xl` — already applied in Task 2 Step 1 if done first; apply here if Task 3 runs before Task 2)

**Interfaces:**
- Consumes: none new.
- Produces: no prop/signature changes to `HeroLaunchForm` — same `{ locale, placeholder, ctaLabel, ctaBadge? }` props, purely internal markup/styling changes.

- [ ] **Step 1: Rewrite `HeroLaunchForm.tsx`**

Replace the entire file with:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroLaunchForm({
  locale,
  placeholder,
  ctaLabel,
}: {
  locale: string;
  placeholder: string;
  ctaLabel: string;
  ctaBadge?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = url.trim() ? `?websiteUrl=${encodeURIComponent(url.trim())}` : "";
    router.push(`/${locale}/auth/register${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
        </svg>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="ink-border h-16 w-full rounded-xl bg-surface pl-12 pr-4 text-base placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <button
        type="submit"
        className="h-16 rounded-xl bg-accent px-8 text-base font-semibold text-white hover:bg-accent-hover"
      >
        {ctaLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Widen the hero form's container in `app/[lang]/page.tsx`**

Find the div wrapping `<HeroLaunchForm ...>` (the one with `mx-auto mt-8 max-w-lg` — note if Task 2 was already done, this is already `max-w-2xl` with a `reveal-up` class and should be left as-is). If Task 2 has NOT been done yet, change:

```tsx
            <div className="mx-auto mt-8 max-w-lg">
              <HeroLaunchForm locale={locale} placeholder={dict.hero.urlPlaceholder} ctaLabel={dict.hero.cta} />
            </div>
```

to:

```tsx
            <div className="mx-auto mt-8 max-w-2xl">
              <HeroLaunchForm locale={locale} placeholder={dict.hero.urlPlaceholder} ctaLabel={dict.hero.cta} />
            </div>
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

Run: `npx eslint .`
Expected: exits 0, no errors.

- [ ] **Step 4: Manual verification in dev server**

Run: `npm run dev`, open `http://localhost:3000/en`, and also resize to a narrow (mobile-width) viewport.

- Confirm the hero input is visibly taller and wider than before, with a small globe/link icon on its left inside the input.
- Confirm the "Launch" button next to it matches the new height.
- Confirm on mobile width the input stacks above the button (unchanged `flex-col sm:flex-row` behavior) and still looks proportionate, not cramped.

Stop the dev server once confirmed (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add components/tournament/HeroLaunchForm.tsx "app/[lang]/page.tsx"
git commit -m "feat: restyle and widen the hero URL input

Input was cramped both in height and in available width (boxed in by
its max-w-lg container). Bumped to h-16/rounded-xl/text-base with a
left-aligned icon, and widened the hero form's container to max-w-2xl."
```

---

### Task 4: SEO completion (hreflang + Search Console verification slot)

**Files:**
- Modify: `app/[lang]/layout.tsx:1-16`
- Modify: `.env.example`
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `isLocale`, `defaultLocale`, `Locale` from `@/lib/i18n/config` (all already exported there); `locales` from the same module (already used in `app/sitemap.ts`).
- Produces: `generateMetadata` replaces the static `metadata` export in `app/[lang]/layout.tsx` — same route, no change to any consumer (Next.js calls this automatically, nothing else in the codebase imports this file's `metadata`/`generateMetadata` directly).

- [ ] **Step 1: Replace the static metadata export in `app/[lang]/layout.tsx`**

Change:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
```

to:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
```

Then change:

```tsx
export const metadata: Metadata = {
  title: "Startup Clash GE",
};
```

to:

```tsx
const DESCRIPTIONS: Record<Locale, string> = {
  en: "The Georgian startup knockout tournament — vote round by round, crown a champion.",
  ka: "ქართული სტარტაპების ნოკაუტ ტურნირი — მისეცი ხმა რაუნდ-რაუნდზე, დააგვირგვინე ჩემპიონი.",
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? (lang as Locale) : defaultLocale;

  return {
    title: "Startup Clash GE",
    description: DESCRIPTIONS[locale],
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ka: "/ka" },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}
```

(Next.js omits the `<meta name="google-site-verification">` tag entirely when `process.env.GOOGLE_SITE_VERIFICATION` is `undefined`, so this is a safe no-op until the env var is set.)

- [ ] **Step 2: Add the env var slot to `.env.example`**

Append, after the `NEXT_PUBLIC_SITE_URL` line:

```
# Google Search Console site verification. Create a property at
# search.google.com/search-console, choose the "HTML tag" verification method,
# and paste just the content="..." value here (not the whole <meta> tag).
GOOGLE_SITE_VERIFICATION=
```

- [ ] **Step 3: Add hreflang alternates to `app/sitemap.ts`**

Replace the file's contents with:

```ts
import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PUBLIC_PATHS = ["", "/faq", "/pricing", "/leaderboard", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
      },
    }))
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

Run: `npx eslint .`
Expected: exits 0, no errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/en`, view page source (or the browser's dev tools Elements panel on `<head>`), confirm:

- `<meta name="description" content="The Georgian startup knockout tournament...">` is present.
- `<link rel="alternate" hreflang="en" href=".../en">` and `hreflang="ka"` both present.
- No `google-site-verification` meta tag is present (since the env var is unset) — this is expected, not a bug.

Switch to `http://localhost:3000/ka` and confirm the description is the Georgian copy.

Then run: `curl -s http://localhost:3000/sitemap.xml | head -30` (with the dev server still running) and confirm each `<url>` entry now has nested `<xhtml:link rel="alternate" hreflang="...">` entries.

Stop the dev server once confirmed (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add "app/[lang]/layout.tsx" .env.example app/sitemap.ts
git commit -m "feat: complete per-locale SEO (hreflang alternates, GSC verification slot)

Root metadata gets per-locale description + alternates.languages
hreflang via generateMetadata, sitemap entries cross-link their
locale counterparts, and a GOOGLE_SITE_VERIFICATION env slot is wired
up (inert until the user creates a Search Console property)."
```

---

### Task 5: Final full-project verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all existing tests pass (20 tests across `lib/bracket/*.test.ts` and `lib/i18n/localized.test.ts`), exit 0.

- [ ] **Step 2: Run the production build**

Run: `npx next build`
Expected: exits 0, `✓ Compiled successfully`, all routes listed including `app/[lang]/privacy`, `app/[lang]/terms`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` as before, with no new errors.

- [ ] **Step 3: Final full-project lint and typecheck**

Run: `npx eslint .`
Expected: exits 0.

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Report status**

Confirm to the user that all 4 tasks are implemented, committed, and verified — ready for `git push` once they approve.
