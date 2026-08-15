"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdvanceRoundButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdvance() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`, { method: "POST" });
      if (!res.ok) {
        const json: { error?: string } = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to advance");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to advance");
    } finally {
      setPending(false);
    }
  }

  const label = status === "registration" || status === "seeding" ? "Start now" : "Advance round now";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleAdvance}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Working..." : label}
      </button>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
