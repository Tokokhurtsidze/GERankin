import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/db/connect";
import { Tournament, type ITournament } from "@/lib/db/models";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm";
import { RegistrationCountdown } from "@/components/tournament/RegistrationCountdown";

async function loadTournaments(): Promise<ITournament[] | null> {
  try {
    await dbConnect();
    return await Tournament.find().sort({ createdAt: -1 }).lean();
  } catch {
    return null;
  }
}

export default async function AdminTournamentsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);
  if (session.user.role !== "admin") redirect(`/${lang}`);

  const tournaments = await loadTournaments();
  const hasActiveTournament = tournaments?.some((t) =>
    ["registration", "seeding", "in_progress"].includes(t.status)
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Admin</p>
      <h1 className="mb-2 mt-2 text-3xl font-bold tracking-tight">Organize Tournaments</h1>
      <p className="mb-8 text-sm text-text-muted">
        Open a new 1-hour registration window (2-32 entrants, dynamic bracket, custom round length).
      </p>

      {tournaments === null ? (
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to manage tournaments." />
      ) : (
        <>
          {!hasActiveTournament && (
            <div className="ink-border hard-shadow-sm mb-10 rounded-xl bg-surface p-6">
              <h2 className="mb-4 text-lg font-semibold">Start a new tournament</h2>
              <CreateTournamentForm />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <div
                key={t._id.toString()}
                className="ink-border flex items-center justify-between rounded-lg bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    {t.status} · {t.entrants?.length ?? 0}/{t.maxEntrants} entrants · round length{" "}
                    {t.roundDurationMinutes}m
                  </p>
                </div>
                {t.status === "registration" && (
                  <RegistrationCountdown closesAt={t.registrationClosesAt.toISOString()} />
                )}
              </div>
            ))}
            {tournaments.length === 0 && (
              <p className="text-text-muted">No tournaments yet — create the first one above.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
