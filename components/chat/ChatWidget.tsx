"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/** Floating AI Concierge — bottom-right widget, expands into a chat panel. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="ink-border hard-shadow flex h-[32rem] w-80 flex-col overflow-hidden rounded-xl bg-bg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Startup Clash Concierge</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-text-muted hover:text-text">
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-text-muted">
                Ask about tournament rules, bracket sizing, or how to register your startup.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`w-fit max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-accent text-white" : "ink-border bg-surface"
                }`}
              >
                {m.parts.map((part, i) => (part.type === "text" ? <span key={i}>{part.text}</span> : null))}
              </div>
            ))}
            {status === "streaming" && (
              <div className="ink-border w-fit max-w-[85%] rounded-lg bg-surface px-3 py-2 text-sm">...</div>
            )}
            {error && (
              <div className="ink-border w-fit max-w-[85%] rounded-lg border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Something went wrong. Please try again.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="ink-border flex-1 rounded-md bg-surface px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={status === "streaming"}
              className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle AI concierge"
        className="ink-border hard-shadow flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    </div>
  );
}
