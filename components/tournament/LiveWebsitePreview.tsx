"use client";

import { useState } from "react";

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

  const microlinkSrc = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

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
        src={url}
        title={alt}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setBlocked(true)}
        // Belt-and-suspenders: X-Frame-Options blocks don't always fire onError.
        ref={(el) => {
          if (!el) return;
          setTimeout(() => {
            try {
              // Cross-origin access throws if the frame actually loaded content;
              // a same-origin "about:blank" after a block means it never loaded.
              const blockedByHeaders = el.contentWindow?.location.href === "about:blank" && !loaded;
              if (blockedByHeaders) setBlocked(true);
            } catch {
              // Threw because it's cross-origin and DID load — that's success, do nothing.
            }
          }, 2500);
        }}
        className="h-full w-full rounded-lg border-0"
      />
    </div>
  );
}
