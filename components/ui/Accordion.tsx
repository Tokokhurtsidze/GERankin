"use client";

import { useState } from "react";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-border border-y border-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="font-medium">{item.question}</span>
              <span className="ml-4 shrink-0 text-text-muted">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <p className="pb-4 text-sm text-text-muted">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
