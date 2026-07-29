import type { Locale } from "./config";

export interface LocalizedText {
  en: string;
  ka: string;
}

export function pickLocalized(field: LocalizedText, locale: Locale): string {
  return field[locale] || field.en || field.ka;
}
