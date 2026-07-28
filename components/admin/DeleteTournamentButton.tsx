"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTournamentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setConfirmText("");
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
    setPending(false);

    if (!res.ok) {
      const json: { error?: string } = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to delete tournament");
      return;
    }
    closeDialog();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="ink-border hard-shadow-sm w-full max-w-sm rounded-xl bg-surface p-6 backdrop:bg-black/40"
      >
        <h2 className="mb-2 text-lg font-semibold">Delete &ldquo;{name}&rdquo;?</h2>
        <p className="mb-4 text-sm text-text-muted">
          This permanently deletes the tournament and all of its matches, votes, and entrant startups. This
          cannot be undone. Type the tournament name to confirm.
        </p>
        {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={name}
          className="ink-border mb-4 w-full rounded-lg bg-bg px-3 py-2 text-sm"
        />
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
            disabled={confirmText !== name || pending}
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Delete tournament"}
          </button>
        </div>
      </dialog>
    </>
  );
}
