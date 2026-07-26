"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
}

const PLACEHOLDER_SLIDES: Slide[] = [
  { id: "1", eyebrow: "Live matchup", title: "No tournament running", body: "Check back once registration opens." },
  { id: "2", eyebrow: "Pitch deck", title: "Startup pitch decks", body: "Founders showcase their product here once entered." },
  { id: "3", eyebrow: "Highlight", title: "Past tournament highlights", body: "Champions and standout matches appear here." },
];

export function SlideDeck({ slides = PLACEHOLDER_SLIDES, autoplay = true }: { slides?: Slide[]; autoplay?: boolean }) {
  const [index, setIndex] = useState(0);
  const activeSlides = slides.length > 0 ? slides : PLACEHOLDER_SLIDES;
  const slide = activeSlides[index % activeSlides.length];

  useEffect(() => {
    if (!autoplay || activeSlides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % activeSlides.length), 5000);
    return () => clearInterval(id);
  }, [autoplay, activeSlides.length]);

  const content = (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 flex flex-col justify-center gap-2 p-10"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">{slide.eyebrow}</p>
      <h2 className="text-2xl font-bold">{slide.title}</h2>
      <p className="text-text-muted">{slide.body}</p>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="ink-border relative h-64 overflow-hidden rounded-xl bg-surface">
        <AnimatePresence mode="wait">{slide.href ? <Link href={slide.href}>{content}</Link> : content}</AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2">
        {activeSlides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 w-6 rounded-full transition-colors ${i === index ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}
