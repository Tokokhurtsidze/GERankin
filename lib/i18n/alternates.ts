import { locales, type Locale } from "./config";

export function localeAlternates(locale: Locale, path: string = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
  };
}
