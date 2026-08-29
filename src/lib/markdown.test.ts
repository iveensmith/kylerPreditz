import { describe, it, expect } from "vitest";
import { renderPostBody } from "./markdown";

describe("renderPostBody", () => {
  it("strips script tags and event handlers", () => {
    const html = renderPostBody('Hello <script>alert(1)</script> world', { sponsored: false });
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("drops inline style and onclick attributes", () => {
    const html = renderPostBody('<p style="color:red" onclick="x()">hi</p>', { sponsored: false });
    expect(html).not.toContain("style=");
    expect(html).not.toContain("onclick");
  });

  it("marks links in a sponsored post rel=sponsored nofollow noopener", () => {
    const html = renderPostBody("[Example](https://example.com)", { sponsored: true });
    expect(html).toContain('rel="sponsored nofollow noopener"');
    expect(html).toContain('target="_blank"');
  });

  it("leaves editorial links dofollow on a non-sponsored post", () => {
    const html = renderPostBody("[Example](https://example.com)", { sponsored: false });
    expect(html).toContain('rel="noopener"');
    expect(html).not.toContain("nofollow");
  });

  it("renders basic markdown structure", () => {
    const html = renderPostBody("# Title\n\nSome **bold** text.", { sponsored: false });
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("rejects javascript: URLs", () => {
    const html = renderPostBody("[x](javascript:alert(1))", { sponsored: false });
    expect(html).not.toContain("javascript:");
  });
});
