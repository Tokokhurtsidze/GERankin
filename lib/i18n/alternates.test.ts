import { describe, it, expect } from "vitest";
import { localeAlternates } from "./alternates";

describe("localeAlternates", () => {
  it("builds the canonical and language alternates for a nested path", () => {
    expect(localeAlternates("en", "/faq")).toEqual({
      canonical: "/en/faq",
      languages: { en: "/en/faq", ka: "/ka/faq" },
    });
  });

  it("builds the canonical and language alternates for the other locale", () => {
    expect(localeAlternates("ka", "/faq")).toEqual({
      canonical: "/ka/faq",
      languages: { en: "/en/faq", ka: "/ka/faq" },
    });
  });

  it("defaults to the root path when none is given", () => {
    expect(localeAlternates("en")).toEqual({
      canonical: "/en",
      languages: { en: "/en", ka: "/ka" },
    });
  });
});
