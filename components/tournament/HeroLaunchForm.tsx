"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroLaunchForm({
  locale,
  placeholder,
  ctaLabel,
}: {
  locale: string;
  placeholder: string;
  ctaLabel: string;
  ctaBadge?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = url.trim() ? `?websiteUrl=${encodeURIComponent(url.trim())}` : "";
    router.push(`/${locale}/auth/register${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="ink-border h-12 w-full flex-1 rounded-lg bg-surface px-4 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="h-12 rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        {ctaLabel}
      </button>
    </form>
  );
}
