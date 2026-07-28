import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Startup } from "@/lib/db/models";
import { LiveWebsitePreview } from "@/components/tournament/LiveWebsitePreview";
import { OutboundLink } from "@/components/tournament/OutboundLink";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function StartupProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  try {
    await dbConnect();
  } catch {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Database not connected" message="Set MONGODB_URI in .env.local to load this startup." />
      </section>
    );
  }

  const startup = await Startup.findById(id).lean();
  if (!startup) notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{startup.name}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            startup.eliminated ? "bg-surface text-text-muted" : "bg-accent-soft text-accent"
          }`}
        >
          {startup.eliminated ? "Eliminated" : "Still in it"}
        </span>
      </div>
      <p className="mt-1 text-text-muted">{startup.tagline}</p>

      <div className="ink-border hard-shadow-sm my-6 h-96 overflow-hidden rounded-xl">
        <LiveWebsitePreview url={startup.websiteUrl} alt={startup.name} />
      </div>

      <p className="mb-6 whitespace-pre-line text-text-muted">{startup.description}</p>

      <OutboundLink
        startupId={startup._id.toString()}
        tournamentId={startup.tournament.toString()}
        href={startup.websiteUrl}
        source="showcase"
      >
        Visit {startup.name} →
      </OutboundLink>
    </section>
  );
}
