import { Accordion } from "@/components/ui/Accordion";
import { getFaqItems } from "@/lib/content/faq";
import { isLocale, type Locale } from "@/lib/i18n/config";

export function FaqAccordion({ locale }: { locale: string }) {
  const items = getFaqItems(isLocale(locale) ? (locale as Locale) : "en");
  return <Accordion items={items} />;
}
