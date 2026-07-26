"use client";

export function OutboundLink({
  startupId,
  tournamentId,
  href,
  source,
  children,
}: {
  startupId: string;
  tournamentId: string;
  href: string;
  source: "card" | "showcase" | "slides" | "leaderboard";
  children: React.ReactNode;
}) {
  function trackClick() {
    navigator.sendBeacon?.(
      "/api/click",
      new Blob([JSON.stringify({ startupId, tournamentId, source })], { type: "application/json" })
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
    >
      {children}
    </a>
  );
}
