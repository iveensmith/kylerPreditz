import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { SITE_URL } from "@/lib/seo";

/**
 * Render a post body (Markdown) to a sanitized HTML string safe for
 * dangerouslySetInnerHTML. Guest-authored content is pasted through the admin
 * editor, so the output is treated as untrusted: an explicit tag/attribute
 * allowlist, no scripts, no inline styles or event handlers.
 *
 * Internal links (site-relative like /predictions/..., or on our own origin) open
 * in the same tab and are never nofollow, even on sponsored posts - they are our
 * own pages, not paid links. Outbound links open in a new tab. On a sponsored post every link is marked
 * rel="sponsored nofollow noopener" per Google's paid-link policy; on a normal
 * editorial post links stay dofollow (the author's editorial choice) with
 * rel="noopener" only.
 */
function isInternalHref(href: string | undefined): boolean {
  if (!href) return false;
  if (href.startsWith("#")) return true;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  return href === SITE_URL || href.startsWith(`${SITE_URL}/`);
}

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
      a: (tagName, attribs) => {
        if (isInternalHref(attribs.href)) {
          const { target: _target, rel: _rel, ...rest } = attribs;
          return { tagName, attribs: rest };
        }
        return { tagName, attribs: { ...attribs, target: "_blank", rel: linkRel } };
      },
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
