import Image from "next/image";
import type { IStartup } from "@/lib/db/models";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";

export function ChampionShowcase({
  startup,
  dict,
  locale,
}: {
  startup: Pick<IStartup, "name" | "logoUrl" | "websiteUrl" | "tagline">;
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <div className="ink-border flex items-center gap-4 rounded-xl bg-surface px-6 py-4">
      <Image
        src={startup.logoUrl}
        alt={startup.name}
        width={56}
        height={56}
        className="ink-border h-14 w-14 rounded-lg object-cover"
      />
      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{dict.hero.championLabel}</p>
        <a
          href={startup.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-semibold hover:underline"
        >
          {startup.name}
        </a>
        <p className="truncate text-sm text-text-muted">{pickLocalized(startup.tagline, locale)}</p>
      </div>
    </div>
  );
}
