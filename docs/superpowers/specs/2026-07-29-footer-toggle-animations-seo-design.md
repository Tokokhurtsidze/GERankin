# Global footer toggle, home-page scroll reveals, hero input restyle, SEO completion

## Motivation

Four polish items requested ahead of launch:

1. The footer only exists on the home page today (as the last slide of its scroll-snap deck).
   Every other route — dashboard, privacy, terms, tournament, startup profile, etc. — has no
   footer at all. Wanted: a footer reachable from every page, presented as an unobtrusive
   bottom-left toggle rather than a static block.
2. The home page has no scroll/entry motion beyond `HallOfFame`'s existing `.reveal-up` CSS
   utility. Wanted: the same "subtle fade + rise" treatment across the rest of the home page's
   sections, for a more premium feel.
3. `HeroLaunchForm`'s URL input reads as too small/plain for the primary hero CTA.
4. SEO is currently generic across locales (single static title/description, no hreflang, no
   Search Console verification slot) — needs per-locale metadata and hreflang so `/en` and `/ka`
   are correctly cross-linked, plus a verification slot ready for Google Search Console.

## Goals

- One footer toggle mechanism, available on every route, respecting the same
  `HideOnFullscreenRoutes` rule the header already follows (hidden on the live match-vote page).
- Home page's redundant last "footer" slide removed once the global toggle replaces it.
- Reuse the existing `.reveal-up` CSS utility (no new animation dependency) across the rest of
  the home page's sections, staggered via `--reveal-index` for grouped items exactly as
  `HallOfFame` already does.
- Larger, icon-accented hero input matching the site's `ink-border`/`rounded-xl` language.
- `[lang]/layout.tsx` metadata becomes locale-aware (`generateMetadata`), with `alternates.languages`
  hreflang and an env-driven `verification.google` field. `sitemap.ts` gains matching
  `alternates.languages` per entry.

## Non-goals

- No new footer *content* — same links/sections, just a different reveal mechanism.
- No animations outside the home page's scroll-snap sections (dashboard, privacy, terms, etc.
  are unchanged).
- No Search Console property is created here — only the code slot (env var) is wired up; the user
  adds the verification code once they create the property.
- No change to vote/tournament/auth business logic.

## Architecture

### 1. Footer toggle

- `components/marketing/ConditionalFooter.tsx`: remove the `HOME_ROUTE` early-return so it renders
  on every route. Keep the existing `HideOnFullscreenRoutes` wrap unchanged.
- `components/marketing/SiteFooter.tsx`: becomes a `"use client"` component. Adds local
  `open` state. Default render: a fixed circular button, bottom-left
  (`fixed bottom-5 left-5 z-40`, `ink-border bg-surface hard-shadow-sm`), an up-chevron SVG that
  rotates 180° when open. Clicking toggles `open`; when `true`, a `framer-motion`
  `AnimatePresence`/`motion.div` panel (`initial={{ y: "100%", opacity: 0 }}`,
  `animate={{ y: 0, opacity: 1 }}`, `exit={{ y: "100%", opacity: 0 }}`) slides up from the bottom
  containing the existing footer content unchanged (brand, tagline, platform links, tools links,
  privacy/terms links, copyright). A full-width low-opacity backdrop behind the panel closes it on
  click, same as the panel's own toggle button.
- `app/[lang]/page.tsx`: remove the `"footer"` entry from the `sections` array passed to
  `SlideScroller`, and remove the `<section id="footer">...<SiteFooter .../></section>` block plus
  its now-unused `SiteFooter` import.

### 2. Home-page scroll reveals

**Correction from initial read:** `HowItWorks`, `PricingPlans`, `Accordion` (used by `FaqAccordion`),
and `FooterCtaBanner` are already client components with framer-motion `whileInView` fade+rise
reveals (same easing/duration/stagger style as `.reveal-up`). These are untouched — re-animating
them would double up. `SlideDeck`'s framer-motion usage is a carousel transition between slides,
not a scroll-entry reveal, and is also untouched (out of scope).

What's actually bare: the hero content block, every section's header (eyebrow + heading) text in
`app/[lang]/page.tsx`, and the two bracket components (`LiveBracketSection`, `HomeBracketTree`) —
both `async` server components (they call `dbConnect`), so `.reveal-up` (CSS-only, no client
boundary needed) is the right tool, consistent with why the codebase already chose it for
`HallOfFame`.

Add `className="reveal-up"` (plus `style={{ "--reveal-index": i }}` for staggered groups, matching
`HallOfFame`'s existing pattern) to:

- Hero content block's individual pieces in `app/[lang]/page.tsx` — eyebrow, heading, subtitle,
  `HeroLaunchForm` wrapper, avatar cluster, champion-showcase block, registration-countdown card
  — each its own `--reveal-index` (0 through 5) for a cascading entrance.
- The eyebrow+heading pair immediately above: the bracket section, the slides section, the
  leaderboard section (above `HallOfFame`, which keeps its own internal reveal untouched), the
  pricing section, the FAQ section, and the bracket-tree section — one `reveal-up` per pair, no
  stagger needed (each is two lines of text, not a list).
- `LiveBracketSection`'s returned wrapper `<div>` (the "Round N" label + match card list + "View
  full bracket" link) — single `reveal-up` on the outer div, no stagger (match cards aren't
  pre-known at this level in a way worth staggering).
- `HomeBracketTree`'s `<ScaleToFitBracket>` wrapper — single `reveal-up`, no stagger.

No changes to `globals.css` — the `.reveal-up` keyframes/media-query already there are reused as-is.

### 3. Hero input restyle

Current input reads as too small in both height *and* length (width) — it's boxed in by the
hero's own container (`app/[lang]/page.tsx`'s hero form wrapper is currently `mx-auto mt-8
max-w-lg`), so even a taller input still looks narrow/cramped, especially on mobile.

`app/[lang]/page.tsx`: widen the hero form wrapper from `max-w-lg` to `max-w-2xl`, giving the
input+button group significantly more horizontal room at every breakpoint.

`components/tournament/HeroLaunchForm.tsx`:
- Wrap the `<input>` in a `relative` container; add an absolutely-positioned inline SVG link/globe
  icon, left-aligned, muted color.
- Input: `h-16 w-full rounded-xl pl-12 pr-4 text-base` (up from `h-12 rounded-lg px-4 text-sm`) —
  `flex-1` already present keeps it stretching to fill the (now wider) available row.
- Button: `h-16 rounded-xl px-8 text-base` (up from `h-12 rounded-lg px-6 text-sm`), matching height.

### 4. SEO completion

- `app/[lang]/layout.tsx`: replace the static `export const metadata` with an `export async function
  generateMetadata({ params })` that returns, per locale:
  - `title`: unchanged ("Startup Clash GE")
  - `description`: English reuses the existing root-layout copy ("The Georgian startup knockout
    tournament — vote round by round, crown a champion."); Georgian is a direct translation
    ("ქართული სტარტაპების ნოკაუტ ტურნირი — მისეცი ხმა რაუნდ-რაუნდზე, დააგვირგვინე ჩემპიონი.")
  - `alternates: { canonical: "/{locale}", languages: { en: "/en", ka: "/ka" } }`
  - `verification: { google: process.env.GOOGLE_SITE_VERIFICATION }` — Next.js omits the meta tag
    entirely when the env var is unset, so this is a no-op until the user adds it.
- `.env.example`: add `GOOGLE_SITE_VERIFICATION=` with a comment pointing to
  `search.google.com/search-console` for how to obtain it.
- `app/sitemap.ts`: add `alternates.languages` (`{ en: <url>, ka: <url> }`) to each entry, cross
  -linking the locale counterpart of every path already listed.

## Testing

- `npm run build` + `npm run lint` + `npx tsc --noEmit` after implementation (existing project
  convention — no dedicated test runner coverage expected for presentational/CSS changes).
- Manual check in dev server: toggle opens/closes on every route type (home, a normal page, the
  fullscreen match-vote page shows no toggle at all), scroll through the home page to confirm
  reveal timing feels right, hero input renders correctly at mobile and desktop widths.
