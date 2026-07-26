import { PricingPlans } from "@/components/marketing/PricingPlans";

export default async function PricingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">Pricing</p>
      <h1 className="mt-2 text-center text-4xl font-bold tracking-tight">Choose your growth plan</h1>
      <div className="mt-12">
        <PricingPlans locale={lang} />
      </div>
    </section>
  );
}
