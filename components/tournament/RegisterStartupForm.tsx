"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const inputClass =
  "ink-border rounded-lg bg-surface px-3.5 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";

export function RegisterStartupForm({
  tournamentId,
  defaultWebsiteUrl,
}: {
  tournamentId: string;
  defaultWebsiteUrl?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      tournamentId,
      name: form.get("name"),
      tagline: { en: form.get("tagline_en"), ka: form.get("tagline_ka") },
      description: { en: form.get("description_en"), ka: form.get("description_ka") },
      logoUrl: normalizeUrl(String(form.get("logoUrl") ?? "")),
      websiteUrl: normalizeUrl(String(form.get("websiteUrl") ?? "")),
    };

    const res = await fetch("/api/register-startup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setPending(false);
    if (!res.ok) {
      const json: { error?: unknown } = await res.json().catch(() => ({}));
      const err = json.error as
        | string
        | { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
        | undefined;
      const message =
        typeof err === "string"
          ? err
          : (err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {})[0]?.[0] ?? "Registration failed");
      setError(message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <input name="name" placeholder="Startup name" required maxLength={80} className={inputClass} />

      <div className="grid gap-4 sm:grid-cols-2">
        <input name="tagline_en" placeholder="One-line tagline (English)" required maxLength={160} className={inputClass} />
        <input name="tagline_ka" placeholder="მოკლე სლოგანი (ქართულად)" required maxLength={160} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <textarea name="description_en" placeholder="Description (English)" required rows={4} className={inputClass} />
        <textarea name="description_ka" placeholder="აღწერა (ქართულად)" required rows={4} className={inputClass} />
      </div>

      <input name="logoUrl" placeholder="Logo URL" required className={inputClass} />
      <input
        name="websiteUrl"
        placeholder="yourstartup.ge"
        required
        defaultValue={defaultWebsiteUrl}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Enter the tournament"}
      </button>
    </form>
  );
}
