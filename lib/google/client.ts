import { createGoogle } from "@ai-sdk/google";

/**
 * Google Generative AI provider instance configured via @ai-sdk/google.
 * The apiKey defaults to the GOOGLE_GENERATIVE_AI_API_KEY env var; the
 * explicit assignment here is purely for clarity and forward-compat.
 */
export const googleAI = createGoogle({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const DEFAULT_CHAT_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
