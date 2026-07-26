import { HallOfFame } from "@/components/marketing/HallOfFame";

export default function LeaderboardPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">Winners</p>
      <h1 className="mb-10 mt-2 text-center text-4xl font-bold tracking-tight">Hall of Fame</h1>
      <HallOfFame />
    </section>
  );
}
