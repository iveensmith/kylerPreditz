import { describe, it, expect } from "vitest";
import { sniffImageType, isValidCoverImage } from "./image-upload";

describe("sniffImageType", () => {
  it("recognises jpeg, png, gif and webp by magic bytes", () => {
    expect(sniffImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe("image/gif");
    expect(sniffImageType(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
  });
  it("rejects SVG, HTML and empty input", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe("isValidCoverImage", () => {
  it("accepts http(s) URLs and our own image paths only", () => {
    expect(isValidCoverImage("https://images.unsplash.com/photo-1?w=1200")).toBe(true);
    expect(isValidCoverImage("/api/blog-image/cmuax0j1m0003iswe")).toBe(true);
    expect(isValidCoverImage("javascript:alert(1)")).toBe(false);
    expect(isValidCoverImage("//evil.com/x.png")).toBe(false);
    expect(isValidCoverImage("/api/blog-image/../../secret")).toBe(false);
  });
});
