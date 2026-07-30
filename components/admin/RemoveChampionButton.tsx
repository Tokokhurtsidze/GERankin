"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveChampionButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleRemove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const json: { error?: string } = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to remove champion");
        return;
      }
      closeDialog();
      router.refresh();
    } catch {
      setError("Failed to remove champion");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-bg"
      >
        Remove from showcase
      </button>

      <dialog
        ref={dialogRef}
        className="ink-border hard-shadow-sm w-full max-w-sm rounded-xl bg-surface p-6 backdrop:bg-black/40"
      >
        <h2 className="mb-2 text-lg font-semibold">Remove &ldquo;{name}&rdquo; from the winners showcase?</h2>
        <p className="mb-4 text-sm text-text-muted">
          This clears the champion for this tournament so it no longer appears in the winners showcase — on the
          homepage, the leaderboard, or as the currently reigning champion in the hero section (which falls back
          to the next most recent past champion, if any). The tournament, its matches, and its startups are not
          deleted.
        </p>
        {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-text-muted hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleRemove}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Removing..." : "Remove champion"}
          </button>
        </div>
      </dialog>
    </>
  );
}
