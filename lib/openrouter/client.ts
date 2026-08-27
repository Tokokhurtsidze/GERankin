import { createOpenAI } from "@ai-sdk/openai";

/**
 * OpenRouter exposes an OpenAI-compatible Chat Completions API, so we reuse
 * the @ai-sdk/openai provider with its baseURL pointed at OpenRouter instead
 * of a bespoke SDK. Model ids are OpenRouter-style, e.g. "anthropic/claude-3.5-sonnet".
 */
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://startupclash.ge",
    "X-Title": "Startup Clash GE",
  },
});

export const DEFAULT_CHAT_MODEL = process.env.OPENROUTER_MODEL ?? "openrouter/free";
