"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateTournamentForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        roundDurationMinutes: Number(form.get("roundDurationMinutes")),
      }),
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
          : (err?.formErrors?.[0] ?? Object.values(err?.fieldErrors ?? {})[0]?.[0] ?? "Failed to create tournament");
      setError(message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Tournament name
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Startup Clash GE — July Cup"
          className="ink-border rounded-lg bg-bg px-3 py-2 font-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Round duration (minutes)
        <input
          name="roundDurationMinutes"
          type="number"
          min={1}
          max={1440}
          defaultValue={1440}
          required
          className="ink-border rounded-lg bg-bg px-3 py-2 font-normal"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Opening..." : "Open 1-hour registration window"}
      </button>
    </form>
  );
}
