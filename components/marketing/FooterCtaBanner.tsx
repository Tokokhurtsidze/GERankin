"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export function FooterCtaBanner({
  locale,
  title,
  cta,
}: {
  locale: string;
  title: string;
  cta: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 } },
  };

  const item: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      className="text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={container}
    >
      <motion.h2 variants={item} className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </motion.h2>
      <motion.div variants={item} className="mt-8">
        <Link
          href={`/${locale}/auth/register`}
          className="inline-block rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          {cta} →
        </Link>
      </motion.div>
    </motion.div>
  );
}
