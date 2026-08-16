import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getActiveTournament, getReigningChampion, getWinnerStartups } from "@/lib/tournament/queries";
import { Match } from "@/lib/db/models";
import { ChampionShowcase } from "@/components/tournament/ChampionShowcase";
import { RegistrationCountdown } from "@/components/tournament/RegistrationCountdown";
import { HeroLaunchForm } from "@/components/tournament/HeroLaunchForm";
import { HowItWorks } from "@/components/tournament/HowItWorks";
import { HomeBracketTree } from "@/components/tournament/HomeBracketTree";
import { LiveBracketSection } from "@/components/tournament/LiveBracketSection";
import { WinnerStartupsSection } from "@/components/marketing/WinnerStartupsSection";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { SlideScroller, type SlideSectionMeta } from "@/components/marketing/SlideScroller";
import { SectionScrollNav } from "@/components/marketing/SectionScrollNav";
import { SlideDeck, type Slide } from "@/components/slides/SlideDeck";
import { notFound } from "next/navigation";

async function buildSlides(locale: string, tournamentId?: string, currentRound?: number): Promise<Slide[]> {
  if (!tournamentId || !currentRound) return [];
  try {
    const docs = await Match.find({ tournament: tournamentId, round: currentRound })
      .populate([
        { path: "startupA", select: "name" },
        { path: "startupB", select: "name" },
      ])
      .limit(4)
      .lean();
    return docs
      .filter((m) => m.startupA && m.startupB)
      .map((m) => ({
        id: m._id.toString(),
        eyebrow: "Live matchup",
        title: `${(m.startupA as unknown as { name: string }).name} vs ${(m.startupB as unknown as { name: string }).name}`,
        body: `${m.votesA} — ${m.votesB} votes so far`,
        href: `/${locale}/tournament/${tournamentId}`,
      }));
  } catch {
    return [];
  }
}

const SLIDE_CLASS =
  "no-scrollbar h-full w-full snap-start flex flex-col items-center justify-center overflow-y-auto px-4 py-12 sm:px-6";

// Same slide, but top-aligned instead of centered — for sections whose content
// (match lists, bracket trees) can grow taller than the viewport. Centering an
// overflowing flex child makes its leading edge scroll-unreachable, so those
// sections need justify-start instead.
const SLIDE_CLASS_TOP =
  "no-scrollbar h-full w-full snap-start flex flex-col items-center justify-start overflow-y-auto px-4 py-12 sm:px-6";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return { alternates: localeAlternates(locale, "") };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const [tournament, champion, winners] = await Promise.all([
    getActiveTournament().catch(() => null),
    getReigningChampion().catch(() => null),
    getWinnerStartups(),
  ]);

  const slides = await buildSlides(
    locale,
    tournament?.status === "in_progress" ? tournament._id.toString() : undefined,
    tournament?.currentRound
  );

  const steps = [
    { title: dict.howItWorks.step1Title, body: dict.howItWorks.step1Body },
    { title: dict.howItWorks.step2Title, body: dict.howItWorks.step2Body },
    { title: dict.howItWorks.step3Title, body: dict.howItWorks.step3Body },
    { title: dict.howItWorks.step4Title, body: dict.howItWorks.step4Body },
  ];

  const sections: SlideSectionMeta[] = [
    { id: "hero", label: "Home" },
    { id: "how-it-works", label: "How it works" },
    { id: "bracket", label: dict.nav.bracket },
    { id: "slides", label: dict.nav.slides },
    { id: "leaderboard", label: dict.nav.winners },
    { id: "pricing", label: dict.nav.pricing },
    { id: "faq", label: dict.nav.faq },
    { id: "bracket-tree", label: dict.nav.fullBracket },
  ];

  return (
    <SlideScroller sections={sections}>
        {/* Hero */}
        <section id="hero" className={SLIDE_CLASS}>
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
        </section>

        {/* How it works */}
        <section id="how-it-works" className={SLIDE_CLASS}>
          <HowItWorks label={dict.howItWorks.label} steps={steps} />
        </section>

        {/* Current round matchups — vote directly, same flow as before */}
        <section id="bracket" className={SLIDE_CLASS_TOP}>
          <div className="w-full max-w-2xl">
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.bracket}</p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.home.liveMatchups}</h2>
            </div>
            <div className="mt-10">
              <LiveBracketSection tournament={tournament} locale={locale} />
            </div>
          </div>
          <SectionScrollNav targetId="bracket" />
        </section>

        {/* Slides */}
        <section id="slides" className={SLIDE_CLASS}>
          <div className="w-full max-w-2xl">
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.slides}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.home.onTheRadar}</h2>
            </div>
            <div className="mt-10">
              <SlideDeck slides={slides} />
            </div>
          </div>
        </section>

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

        {/* Pricing */}
        <section id="pricing" className={SLIDE_CLASS}>
          <div className="w-full max-w-4xl">
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.pricing}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.pricing.heading}</h2>
            </div>
            <div className="mt-10">
              <PricingPlans locale={locale} dict={dict} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={SLIDE_CLASS}>
          <div className="w-full max-w-2xl">
            <div className="reveal-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                {dict.nav.faq}
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.faq.heading}</h2>
            </div>
            <div className="mt-10">
              <FaqAccordion locale={locale} />
            </div>
          </div>
        </section>

        {/* Full tournament tree */}
        <section id="bracket-tree" className={SLIDE_CLASS}>
          <div className="flex h-full w-full max-w-6xl flex-col">
            <div className="reveal-up shrink-0">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.bracket}</p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{dict.nav.fullBracket}</h2>
            </div>
            <div className="mt-6 min-h-0 flex-1">
              <HomeBracketTree
                tournament={tournament}
                locale={locale}
                dict={{ round: dict.bracket.round, final: dict.bracket.final }}
              />
            </div>
          </div>
        </section>
    </SlideScroller>
  );
}
