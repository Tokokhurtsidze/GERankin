import { describe, it, expect } from "vitest";
import { splitWinnerColumns, type WinnerStartup } from "./winner-showcase";

function winner(id: string): WinnerStartup {
  return { id, name: `Startup ${id}`, logoUrl: `https://example.com/${id}.png`, websiteUrl: `https://${id}.example.com` };
}

describe("splitWinnerColumns", () => {
  it("returns empty columns for no winners", () => {
    expect(splitWinnerColumns([])).toEqual({ left: [], right: [] });
  });

  it("puts a single winner on the left", () => {
    const w = winner("a");
    expect(splitWinnerColumns([w])).toEqual({ left: [w], right: [] });
  });

  it("alternates left/right starting with left for two winners", () => {
    const a = winner("a");
    const b = winner("b");
    expect(splitWinnerColumns([a, b])).toEqual({ left: [a], right: [b] });
  });

  it("gives the left column the extra item on an odd total", () => {
    const [a, b, c] = ["a", "b", "c"].map(winner);
    expect(splitWinnerColumns([a, b, c])).toEqual({ left: [a, c], right: [b] });
  });

  it("preserves input order within each column", () => {
    const [a, b, c, d, e] = ["a", "b", "c", "d", "e"].map(winner);
    expect(splitWinnerColumns([a, b, c, d, e])).toEqual({ left: [a, c, e], right: [b, d] });
  });
});
