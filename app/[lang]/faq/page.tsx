import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">FAQ</p>
      <h1 className="mt-2 text-center text-4xl font-bold tracking-tight">Before you launch</h1>
      <div className="mt-10">
        <FaqAccordion />
      </div>
    </section>
  );
}
