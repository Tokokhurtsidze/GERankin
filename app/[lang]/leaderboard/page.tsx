import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WinnerStartupsSection } from "@/components/marketing/WinnerStartupsSection";
import { getWinnerStartups } from "@/lib/tournament/queries";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const TITLES: Record<Locale, string> = {
  en: "Hall of Fame — Startup Clash GE",
  ka: "დიდების დარბაზი — Startup Clash GE",
};

const DESCRIPTIONS: Record<Locale, string> = {
  en: "Past tournament champions and completed knockout brackets from the Georgian startup community.",
  ka: "წინა ტურნირების ჩემპიონები და დასრულებული ბრეკეტები ქართული სტარტაპების საზოგადოებიდან.",
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return {
    title: TITLES[locale],
    description: DESCRIPTIONS[locale],
    alternates: localeAlternates(locale, "/leaderboard"),
  };
}

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
