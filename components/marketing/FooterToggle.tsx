"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SiteFooter } from "./SiteFooter";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function FooterToggle({ locale, dict }: { locale: string; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the overlay whenever the route changes, since this component lives in the
  // root layout and persists across client-side navigation. Adjusting state during
  // render (rather than in a useEffect) avoids an extra post-navigation render pass.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Hide footer" : "Show footer"}
        className="ink-border hard-shadow-sm fixed bottom-5 left-5 z-[80] flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text transition-colors hover:bg-border"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="footer-backdrop"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-bg/60 backdrop-blur-sm"
            />
            <motion.div
              key="footer-panel"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 bottom-0 z-[70] max-h-[80vh] overflow-y-auto bg-bg"
            >
              <SiteFooter locale={locale} dict={dict} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
