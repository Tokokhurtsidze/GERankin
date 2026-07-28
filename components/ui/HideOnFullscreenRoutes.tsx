"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const HIDDEN_ON = /\/tournament\/[^/]+\/match\/[^/]+/;

/** Hides its children on routes that want the full viewport (currently just the match compare page). */
export function HideOnFullscreenRoutes({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (HIDDEN_ON.test(pathname ?? "")) return null;
  return <>{children}</>;
}
