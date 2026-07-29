import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return { alternates: localeAlternates(locale, "/faq") };
}

export default async function FaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{dict.nav.faq}</p>
      <h1 className="mt-2 text-center text-4xl font-bold tracking-tight">{dict.faq.heading}</h1>
      <div className="mt-10">
        <FaqAccordion locale={lang} />
      </div>
    </section>
  );
}
