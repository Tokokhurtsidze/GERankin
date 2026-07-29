import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HallOfFame } from "@/components/marketing/HallOfFame";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return { alternates: localeAlternates(locale, "/leaderboard") };
}

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
