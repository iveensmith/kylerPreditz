import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * Render a post body (Markdown) to a sanitized HTML string safe for
 * dangerouslySetInnerHTML. Guest-authored content is pasted through the admin
 * editor, so the output is treated as untrusted: an explicit tag/attribute
 * allowlist, no scripts, no inline styles or event handlers.
 *
 * Outbound links open in a new tab. On a sponsored post every link is marked
 * rel="sponsored nofollow noopener" per Google's paid-link policy; on a normal
 * editorial post links stay dofollow (the author's editorial choice) with
 * rel="noopener" only.
 */
export function renderPostBody(markdown: string, opts: { sponsored: boolean }): string {
  const rawHtml = marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string;

  const linkRel = opts.sponsored ? "sponsored nofollow noopener" : "noopener";

  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "blockquote", "pre", "code",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "del", "s",
      "a", "img", "hr", "br",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "loading"],
      td: ["align"],
      th: ["align"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: linkRel,
        },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          src: attribs.src ?? "",
          alt: attribs.alt ?? "",
          loading: "lazy",
        },
      }),
    },
  });
}
