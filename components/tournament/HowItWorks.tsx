"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

interface Step {
  title: string;
  body: string;
}

export function HowItWorks({ label, steps }: { label: string; steps: Step[] }) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-3xl">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <ol className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
        {steps.map((step, i) => (
          <motion.li
            key={i}
            className="ink-border rounded-xl bg-surface p-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={itemVariants}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-semibold">{step.title}</p>
            <p className="mt-1.5 text-sm text-text-muted">{step.body}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
