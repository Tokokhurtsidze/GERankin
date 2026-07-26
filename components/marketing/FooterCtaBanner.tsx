import Link from "next/link";
import { AvatarCluster } from "@/components/ui/AvatarCluster";

export function FooterCtaBanner({
  locale,
  title,
  cta,
  founderCount,
  joinLabel,
}: {
  locale: string;
  title: string;
  cta: string;
  founderCount: number;
  joinLabel: string;
}) {
  return (
    <div className="text-center">
      <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <Link
        href={`/${locale}/auth/register`}
        className="mt-8 inline-block rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        {cta} →
      </Link>
      <div className="mt-6 flex justify-center">
        <AvatarCluster count={founderCount} label={joinLabel} />
      </div>
    </div>
  );
}
