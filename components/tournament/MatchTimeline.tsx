"use client";

import { useEffect, useState } from "react";

interface CommentEntry {
  _id: string;
  body: string;
  createdAt: string;
  author?: { name?: string };
}

export function MatchTimeline({ matchId, label }: { matchId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentEntry[] | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || comments !== null) return;
    fetch(`/api/comments?matchId=${matchId}`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, [open, comments, matchId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setPending(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, body: draft.trim() }),
    });
    setPending(false);
    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [comment, ...(prev ?? [])]);
      setDraft("");
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text"
      >
        {label} {open ? "−" : "+"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <form onSubmit={handlePost} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something..."
              maxLength={1000}
              className="ink-border flex-1 rounded-full bg-bg px-3 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Post
            </button>
          </form>
          <ul className="flex flex-col gap-2">
            {comments?.map((c) => (
              <li key={c._id} className="text-xs">
                <span className="font-semibold">{c.author?.name ?? "Anon"}</span>{" "}
                <span className="text-text-muted">{c.body}</span>
              </li>
            ))}
            {comments?.length === 0 && <p className="text-xs text-text-muted">No comments yet — be first.</p>}
          </ul>
        </div>
      )}
    </div>
  );
}
