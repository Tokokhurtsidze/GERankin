import { HideOnFullscreenRoutes } from "@/components/ui/HideOnFullscreenRoutes";
import { FooterToggle } from "./FooterToggle";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Footer toggle on every route except ones that need the full viewport (the live match compare page). */
export function ConditionalFooter({ locale, dict }: { locale: string; dict: Dictionary }) {
  return (
    <HideOnFullscreenRoutes>
      <FooterToggle locale={locale} dict={dict} />
    </HideOnFullscreenRoutes>
  );
}
