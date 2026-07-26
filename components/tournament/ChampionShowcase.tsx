import Image from "next/image";
import type { IStartup } from "@/lib/db/models";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function ChampionShowcase({
  startup,
  dict,
}: {
  startup: Pick<IStartup, "name" | "logoUrl" | "websiteUrl" | "tagline">;
  dict: Dictionary;
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
      <div className="text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{dict.hero.championLabel}</p>
        <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
          {startup.name}
        </a>
        <p className="text-sm text-text-muted">{startup.tagline}</p>
      </div>
    </div>
  );
}
