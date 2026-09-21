import { describe, it, expect } from "vitest";
import { composeHref, parseHref } from "./link-form";

const base = { protocol: "https://" as const };

describe("composeHref", () => {
  it("adds the chosen protocol to a bare address", () => {
    expect(composeHref({ ...base, type: "url", url: "example.com/page" })).toBe("https://example.com/page");
    expect(composeHref({ type: "url", protocol: "http://", url: "example.com" })).toBe("http://example.com");
  });
  it("keeps a pasted full address", () => {
    expect(composeHref({ ...base, type: "url", url: "https://a.com/x" })).toBe("https://a.com/x");
  });
  it("builds internal paths and email links", () => {
    expect(composeHref({ ...base, type: "internal", url: "blog/my-post" })).toBe("/blog/my-post");
    expect(composeHref({ ...base, type: "internal", url: "/leagues" })).toBe("/leagues");
    expect(composeHref({ ...base, type: "email", url: "hi@site.com" })).toBe("mailto:hi@site.com");
  });
  it("returns null for an empty address", () => {
    expect(composeHref({ ...base, type: "url", url: "  " })).toBeNull();
  });
});

describe("parseHref", () => {
  it("round-trips the three link types", () => {
    expect(parseHref("/blog/x")).toEqual({ type: "internal", protocol: "https://", url: "/blog/x" });
    expect(parseHref("mailto:a@b.com")).toEqual({ type: "email", protocol: "https://", url: "a@b.com" });
    expect(parseHref("http://a.com/y")).toEqual({ type: "url", protocol: "http://", url: "a.com/y" });
  });
});
