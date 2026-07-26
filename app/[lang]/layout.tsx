import type { Metadata } from "next";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileNav } from "@/components/ui/MobileNav";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { auth, signOut } from "@/lib/auth/auth";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Startup Clash GE",
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const session = await auth().catch(() => null);

  return (
    <div lang={locale} className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-bg/90 backdrop-blur-md">
        <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href={`/${locale}`}
            className="group flex shrink-0 items-baseline gap-1.5 whitespace-nowrap text-base font-bold tracking-tight"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent transition-transform group-hover:scale-125" />
            Startup Clash <span className="text-text-muted">GE</span>
          </Link>

          <div className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium tracking-wide text-text-muted xl:flex">
            <Link href={`/${locale}#bracket`} className="group relative py-1 transition-colors hover:text-text">
              {dict.nav.bracket}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
            <Link href={`/${locale}#leaderboard`} className="group relative py-1 transition-colors hover:text-text">
              {dict.nav.winners}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
            <Link href={`/${locale}#slides`} className="group relative py-1 transition-colors hover:text-text">
              {dict.nav.slides}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
            <Link href={`/${locale}#pricing`} className="group relative py-1 transition-colors hover:text-text">
              {dict.nav.pricing}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
            <Link href={`/${locale}#faq`} className="group relative py-1 transition-colors hover:text-text">
              {dict.nav.faq}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
            {session?.user.role === "admin" && (
              <Link href={`/${locale}/admin/tournaments`} className="group relative py-1 transition-colors hover:text-text">
                Organize
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-4 whitespace-nowrap xl:flex">
              <Link
                href={locale === "en" ? "/ka" : "/en"}
                className="ink-border rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {locale === "en" ? "ka" : "en"}
              </Link>

              <div className="h-5 w-px bg-border" />

              {session?.user ? (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    aria-label="Dashboard"
                    className="ink-border flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-semibold transition-transform hover:scale-105"
                  >
                    {(session.user.name ?? "?").slice(0, 1).toUpperCase()}
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: `/${locale}` });
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href={`/${locale}/auth/login`} className="text-sm font-medium text-text-muted transition-colors hover:text-text">
                  {dict.nav.login}
                </Link>
              )}
              <Link
                href={`/${locale}/auth/register`}
                className="hard-shadow-sm rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.98]"
              >
                {dict.nav.launch}
              </Link>
            </div>

            <ThemeToggle />

            <MobileNav>
              <Link href={`/${locale}#bracket`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                {dict.nav.bracket}
              </Link>
              <Link href={`/${locale}#leaderboard`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                {dict.nav.winners}
              </Link>
              <Link href={`/${locale}#slides`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                {dict.nav.slides}
              </Link>
              <Link href={`/${locale}#pricing`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                {dict.nav.pricing}
              </Link>
              <Link href={`/${locale}#faq`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                {dict.nav.faq}
              </Link>
              {session?.user.role === "admin" && (
                <Link href={`/${locale}/admin/tournaments`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                  Organize
                </Link>
              )}

              <div className="my-2 h-px bg-border" />

              <Link
                href={locale === "en" ? "/ka" : "/en"}
                className="rounded-lg px-3 py-2.5 text-text-muted hover:bg-surface hover:text-text"
              >
                {locale === "en" ? "ქართული" : "English"}
              </Link>

              {session?.user ? (
                <>
                  <Link href={`/${locale}/dashboard`} className="rounded-lg px-3 py-2.5 text-text-muted hover:bg-surface hover:text-text">
                    {dict.nav.dashboard}
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: `/${locale}` });
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-text-muted hover:bg-surface hover:text-text"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href={`/${locale}/auth/login`} className="rounded-lg px-3 py-2.5 text-text-muted hover:bg-surface hover:text-text">
                  {dict.nav.login}
                </Link>
              )}

              <Link
                href={`/${locale}/auth/register`}
                className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-center font-semibold text-white hover:bg-accent-hover"
              >
                {dict.nav.launch}
              </Link>
            </MobileNav>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <SiteFooter locale={locale} dict={dict} />

      <ChatWidget />
    </div>
  );
}

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ka" }];
}
