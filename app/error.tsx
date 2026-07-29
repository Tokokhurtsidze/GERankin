"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled render error:", error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">Error</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-text-muted">
        An unexpected error occurred. Try again, or head back to the home page.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => unstable_retry()}
          className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="ink-border rounded-lg bg-surface px-4 py-2.5 font-semibold text-text hover:bg-border"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
