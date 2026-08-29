import { describe, it, expect } from "vitest";
import { assertNoBannedPhrases } from "./content-rules";

describe("assertNoBannedPhrases", () => {
  it("passes clean copy", () => {
    expect(() => assertNoBannedPhrases("Today's football predictions", "Statistical estimates only.")).not.toThrow();
  });

  it("rejects banned phrases case-insensitively", () => {
    expect(() => assertNoBannedPhrases("This is a SURE WIN tip")).toThrow(/disallowed phrase/i);
    expect(() => assertNoBannedPhrases(null, "guaranteed win this weekend")).toThrow();
    expect(() => assertNoBannedPhrases("fixed match alert")).toThrow();
  });

  it("ignores null/undefined inputs", () => {
    expect(() => assertNoBannedPhrases(null, undefined, "clean text")).not.toThrow();
  });
});
