import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Startup, ClickAnalytics, type IStartup } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";

async function loadDashboardData(ownerId: string): Promise<{ startup: IStartup | null; clickCount: number } | null> {
  try {
    await dbConnect();
    const startup = await Startup.findOne({ owner: ownerId }).sort({ createdAt: -1 }).lean();
    const clickCount = startup ? await ClickAnalytics.countDocuments({ startup: startup._id }) : 0;
    return { startup, clickCount };
  } catch {
    return null;
  }
}

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login?callbackUrl=${encodeURIComponent(`/${lang}/dashboard`)}`);

  const data = await loadDashboardData(session.user.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Dashboard</p>
      <h1 className="mb-8 mt-2 text-3xl font-bold tracking-tight">Founder Dashboard</h1>
      {data === null ? (
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load your dashboard." />
      ) : !data.startup ? (
        <p className="text-text-muted">You haven&apos;t registered a startup yet.</p>
      ) : (
        <div className="ink-border hard-shadow-sm rounded-xl bg-surface p-6">
          <h2 className="text-xl font-semibold">{data.startup.name}</h2>
          <p className="text-text-muted">{pickLocalized(data.startup.tagline, lang as Locale)}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-text-muted">Votes received</dt>
              <dd className="text-lg font-semibold">{data.startup.totalVotesReceived}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Referral clicks</dt>
              <dd className="text-lg font-semibold">{data.clickCount}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Status</dt>
              <dd className="text-lg font-semibold">
                {data.startup.eliminated ? (
                  <span className="text-text-muted">Eliminated</span>
                ) : (
                  <span className="text-accent">Still in it</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Seed</dt>
              <dd className="text-lg font-semibold">#{data.startup.seed ?? "—"}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
