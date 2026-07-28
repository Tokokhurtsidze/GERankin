import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function SiteFooter({ locale, dict }: { locale: string; dict: Dictionary }) {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <p className="text-base font-bold">
            Startup Clash <span className="text-text-muted">GE</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-text-muted">{dict.footer.tagline}</p>
          <p className="mt-4 text-xs text-text-muted">© {new Date().getFullYear()} Startup Clash GE</p>
        </div>

        <div className="flex flex-wrap gap-x-16 gap-y-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{dict.footer.platform}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-text-muted">
              <li>
                <Link href={`/${locale}/auth/login`} className="hover:text-text">
                  {dict.nav.login}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#pricing`} className="hover:text-text">
                  {dict.nav.pricing}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="hover:text-text">
                  {dict.nav.dashboard}
                </Link>
              </li>
            </ul>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{dict.footer.tools}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-text-muted">
              <li>
                <Link href={`/${locale}#leaderboard`} className="hover:text-text">
                  {dict.nav.winners}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#slides`} className="hover:text-text">
                  {dict.nav.slides}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#faq`} className="hover:text-text">
                  {dict.nav.faq}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
