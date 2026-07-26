import { SlideDeck, type Slide } from "@/components/slides/SlideDeck";
import { dbConnect } from "@/lib/db/connect";
import { Startup } from "@/lib/db/models";

// Dedicated route for pitch-deck / matchup / historical-highlight slides.
async function loadStartupSlides(lang: string): Promise<Slide[]> {
  try {
    await dbConnect();
    const startups = await Startup.find().sort({ createdAt: -1 }).limit(12).lean();
    return startups.map((s) => ({
      id: s._id.toString(),
      eyebrow: s.eliminated ? "Eliminated" : "In the running",
      title: s.name,
      body: s.tagline,
      href: `/${lang}/startup/${s._id.toString()}`,
    }));
  } catch {
    return [];
  }
}

export default async function FrontendSlidesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const slides = await loadStartupSlides(lang);

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight">Frontend Slides</h1>
      <p className="mb-10 text-center text-sm text-text-muted">
        Every registered startup&apos;s pitch, one slide at a time.
      </p>
      <SlideDeck slides={slides} />
    </section>
  );
}
