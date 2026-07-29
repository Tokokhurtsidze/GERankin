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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
        </svg>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="ink-border h-16 w-full rounded-xl bg-surface pl-12 pr-4 text-base placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <button
        type="submit"
        className="h-16 rounded-xl bg-accent px-8 text-base font-semibold text-white hover:bg-accent-hover"
      >
        {ctaLabel}
      </button>
    </form>
  );
}
