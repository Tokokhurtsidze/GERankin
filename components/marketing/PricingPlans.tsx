"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { getPricingPlans } from "@/lib/content/pricing";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function PricingPlans({ locale, dict }: { locale: string; dict: Dictionary }) {
  const shouldReduceMotion = useReducedMotion();
  const plans = getPricingPlans(isLocale(locale) ? (locale as Locale) : "en");
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const itemVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.min(Math.max(idx, 0), plans.length - 1));
  }

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0"
      >
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={`ink-border flex w-[85%] shrink-0 snap-center flex-col rounded-xl bg-surface p-6 sm:w-auto sm:shrink ${
              plan.highlighted ? "ring-1 ring-accent" : ""
            }`}
          >
            {plan.highlighted && (
              <span className="mb-3 w-fit rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                {dict.pricing.mostPopular}
              </span>
            )}
            <p className="font-semibold">{plan.name}</p>
            <p className="mt-1 text-sm text-text-muted">{plan.tagline}</p>

            <p className="mt-6">
              <span className="text-3xl font-bold">{plan.price}</span>{" "}
              <span className="text-sm text-text-muted">{plan.period}</span>
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={plan.ctaHref.startsWith("mailto:") ? plan.ctaHref : `/${locale}/${plan.ctaHref}`}
              className="mt-8 rounded-lg bg-accent px-5 py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
            >
              {plan.cta} →
            </a>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2 sm:hidden">
        {plans.map((plan, i) => (
          <button
            key={plan.name}
            onClick={() => goTo(i)}
            aria-label={`Go to ${plan.name}`}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-accent" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
