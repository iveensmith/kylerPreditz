import { describe, it, expect } from "vitest";
import { renderPostBody, bodyToEditorHtml, looksLikeHtml } from "./markdown";

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

  it("keeps site-relative links in the same tab and never nofollow, even when sponsored", () => {
    const html = renderPostBody("[Tips](/predictions)", { sponsored: true });
    expect(html).toContain('href="/predictions"');
    expect(html).not.toContain("target=");
    expect(html).not.toContain("nofollow");
  });

  it("treats protocol-relative URLs as outbound", () => {
    const html = renderPostBody("[x](//evil.example.com)", { sponsored: false });
    expect(html).toContain('target="_blank"');
  });

  it("renders editor HTML as-is (sanitized), keeping text-align but dropping other styles", () => {
    const html = renderPostBody(
      '<p style="text-align:center;color:red" onclick="x()">Hi <strong>there</strong></p><script>1</script>',
      { sponsored: false },
    );
    expect(html).toContain("text-align:center");
    expect(html).not.toContain("color:red");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<script");
  });

  it("keeps editor tables, sub/superscript and underline", () => {
    const html = renderPostBody(
      "<table><tbody><tr><th colspan=\"2\">H</th></tr></tbody></table><p><u>u</u> x<sub>2</sub> x<sup>2</sup></p>",
      { sponsored: false },
    );
    expect(html).toContain("<table>");
    expect(html).toContain("<sub>2</sub>");
    expect(html).toContain("<u>u</u>");
  });

  it("detects HTML vs Markdown bodies and converts Markdown for the editor", () => {
    expect(looksLikeHtml("<p>hi</p>")).toBe(true);
    expect(looksLikeHtml("## Heading\n\ntext")).toBe(false);
    expect(bodyToEditorHtml("## Heading")).toContain("<h2");
    expect(bodyToEditorHtml("<p>hi</p>")).toBe("<p>hi</p>");
  });
});
