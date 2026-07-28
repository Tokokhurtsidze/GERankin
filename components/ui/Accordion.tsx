"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const itemVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="mx-auto max-w-2xl divide-y divide-border border-y border-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `accordion-panel-${i}`;
        const buttonId = `accordion-button-${i}`;
        return (
          <motion.div
            key={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              id={buttonId}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="font-medium">{item.question}</span>
              <span className="ml-4 shrink-0 text-text-muted">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <p id={panelId} role="region" aria-labelledby={buttonId} className="pb-4 text-sm text-text-muted">
                {item.answer}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
