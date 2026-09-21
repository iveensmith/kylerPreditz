import { describe, it, expect } from "vitest";
import { parseTags, MAX_TAGS, MAX_TAG_LENGTH } from "./tags";

describe("parseTags", () => {
  it("splits on commas, trims and drops empties", () => {
    expect(parseTags(" xG , premier league,, ")).toEqual(["xG", "premier league"]);
  });
  it("de-duplicates case-insensitively, keeping the first spelling", () => {
    expect(parseTags("xG, XG, Xg")).toEqual(["xG"]);
  });
  it("caps count and length", () => {
    const many = Array.from({ length: 20 }, (_, i) => `t${i}`).join(",");
    expect(parseTags(many)).toHaveLength(MAX_TAGS);
    expect(parseTags("a".repeat(100))[0]).toHaveLength(MAX_TAG_LENGTH);
  });
});
