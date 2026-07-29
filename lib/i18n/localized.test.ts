import { describe, it, expect } from "vitest";
import { pickLocalized } from "./localized";

describe("pickLocalized", () => {
  it("returns the value for the requested locale", () => {
    expect(pickLocalized({ en: "Hello", ka: "გამარჯობა" }, "en")).toBe("Hello");
    expect(pickLocalized({ en: "Hello", ka: "გამარჯობა" }, "ka")).toBe("გამარჯობა");
  });

  it("falls back to English when the requested locale is blank", () => {
    expect(pickLocalized({ en: "Hello", ka: "" }, "ka")).toBe("Hello");
  });

  it("falls back to Georgian when English is blank", () => {
    expect(pickLocalized({ en: "", ka: "გამარჯობა" }, "en")).toBe("გამარჯობა");
  });
});
