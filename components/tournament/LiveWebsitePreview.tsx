"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tries a live iframe embed first. If the target site sends X-Frame-Options: DENY
 * (or CSP frame-ancestors), the iframe's load event never fires the way we expect
 * and browsers block rendering silently — so we can't detect the block from the
 * `onError` event. Instead we race a short timeout: if the iframe hasn't reported
 * ready by then, assume it's blocked and fall back to a static Microlink screenshot.
 */
export function LiveWebsitePreview({ url, alt }: { url: string; alt: string }) {
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(loaded);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const microlinkSrc = `/api/screenshot?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = iframeRef.current;
      if (!el) return;
      try {
        // Cross-origin access throws if the frame actually loaded content;
        // a same-origin "about:blank" after a block means it never loaded.
        const blockedByHeaders = el.contentWindow?.location.href === "about:blank" && !loadedRef.current;
        if (blockedByHeaders) setBlocked(true);
      } catch {
        // Threw because it's cross-origin and DID load — that's success, do nothing.
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [url]);

  if (blocked) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={microlinkSrc} alt={alt} className="h-full w-full rounded-lg object-cover" />;
  }

  return (
    <div className="relative h-full w-full">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      )}
      <iframe
        ref={iframeRef}
        src={url}
        title={alt}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setBlocked(true)}
        className="h-full w-full rounded-lg border-0"
      />
    </div>
  );
}
