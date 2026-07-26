import { auth } from "@/lib/auth/auth";
import { getActiveTournament } from "@/lib/tournament/queries";
import { RegisterStartupForm } from "@/components/tournament/RegisterStartupForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { redirect } from "next/navigation";

export default async function RegisterStartupPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ websiteUrl?: string }>;
}) {
  const { lang } = await params;
  const { websiteUrl } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);

  const tournament = await getActiveTournament().catch(() => "db_error" as const);

  if (tournament === "db_error") {
    return (
      <section className="mx-auto max-w-xl px-4 py-16">
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to open registration." />
      </section>
    );
  }

  if (!tournament || tournament.status !== "registration") {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Registration is closed</h1>
        <p className="mt-2 text-text-muted">
          There is no open registration window right now. Check back before the next tournament kicks off.
        </p>
      </section>
    );
  }

  const full = (tournament.entrants?.length ?? 0) >= tournament.maxEntrants;

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Enter the arena</p>
      <h1 className="mb-2 mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Register your startup</h1>
      <p className="mb-8 text-sm text-text-muted">
        One entry per account. {(tournament.entrants?.length ?? 0)}/{tournament.maxEntrants} slots filled.
      </p>
      {full ? (
        <p className="font-semibold text-red-600">This tournament is full.</p>
      ) : (
        <RegisterStartupForm tournamentId={tournament._id.toString()} defaultWebsiteUrl={websiteUrl} />
      )}
    </section>
  );
}
