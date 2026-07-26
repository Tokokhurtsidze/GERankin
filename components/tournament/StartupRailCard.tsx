import Image from "next/image";
import Link from "next/link";

export function StartupRailCard({
  locale,
  id,
  name,
  tagline,
  logoUrl,
}: {
  locale: string;
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
}) {
  return (
    <Link href={`/${locale}/startup/${id}`} className="ink-border block rounded-lg bg-surface p-4">
      <Image src={logoUrl} alt={name} width={32} height={32} className="ink-border rounded-md object-cover" />
      <p className="mt-2 text-sm font-semibold">{name}</p>
      <p className="mt-1 text-xs text-text-muted">{tagline}</p>
    </Link>
  );
}
