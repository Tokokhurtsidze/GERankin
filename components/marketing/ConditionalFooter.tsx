"use client";

import { usePathname } from "next/navigation";
import { HideOnFullscreenRoutes } from "@/components/ui/HideOnFullscreenRoutes";
import { SiteFooter } from "./SiteFooter";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const HOME_ROUTE = /^\/(en|ka)\/?$/;

/**
 * Hides the global footer on routes that need the full viewport (the match
 * compare page, via HideOnFullscreenRoutes) and on the homepage, which
 * renders its own SiteFooter as the last slide in its scroll-snap deck
 * instead — rendering it here too would duplicate it.
 */
export function ConditionalFooter({ locale, dict }: { locale: string; dict: Dictionary }) {
  const pathname = usePathname();
  if (HOME_ROUTE.test(pathname ?? "")) return null;

  return (
    <HideOnFullscreenRoutes>
      <SiteFooter locale={locale} dict={dict} />
    </HideOnFullscreenRoutes>
  );
}
