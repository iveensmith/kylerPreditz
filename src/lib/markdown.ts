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

/** Bodies saved by the rich-text editor are HTML; older posts are Markdown. */
export function looksLikeHtml(body: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|table|hr|figure|img|pre)\b/i.test(body);
}

/** HTML for the admin editor: Markdown posts are converted, HTML posts pass through. */
export function bodyToEditorHtml(body: string): string {
  return looksLikeHtml(body) ? body : (marked.parse(body, { async: false, gfm: true, breaks: false }) as string);
}

/** Plain text of a body (either format), for meta-description fallbacks. */
export function bodyToPlainText(body: string): string {
  return bodyToEditorHtml(body).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function renderPostBody(markdown: string, opts: { sponsored: boolean }): string {
  const rawHtml = looksLikeHtml(markdown)
    ? markdown
    : (marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string);

  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "blockquote", "pre", "code",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "del", "s",
      "a", "img", "hr", "br",
      "table", "thead", "tbody", "tr", "th", "td", "sub", "sup", "u",
      "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "loading"],
      td: ["align", "colspan", "rowspan"],
      th: ["align", "colspan", "rowspan"],
      p: ["style"],
      h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
    },
    // Only editor text alignment survives; every other inline style is dropped.
    allowedStyles: {
      "*": { "text-align": [/^(left|right|center|justify)$/] },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href;
        const internal = isInternalHref(href);
        const mail = /^mailto:/i.test(href ?? "");
        // Editor-chosen target: only the two safe values are honoured.
        const chosen = attribs.target === "_blank" || attribs.target === "_self" ? attribs.target : undefined;
        const target = mail ? undefined : internal ? (chosen === "_blank" ? "_blank" : undefined) : (chosen ?? "_blank");

        // rel: sponsored posts force sponsored+nofollow on outbound links; authors may add
        // nofollow/ugc/sponsored; noopener always accompanies a new-tab link.
        const wanted = new Set<string>();
        if (opts.sponsored && !internal && !mail) { wanted.add("sponsored"); wanted.add("nofollow"); }
        for (const t of (attribs.rel ?? "").split(/\s+/)) if (t === "nofollow" || t === "ugc" || t === "sponsored") wanted.add(t);
        if (target === "_blank") wanted.add("noopener");

        const out: Record<string, string> = { href };
        if (attribs.title) out.title = attribs.title;
        if (target) out.target = target;
        if (wanted.size) out.rel = [...wanted].join(" ");
        return { tagName, attribs: out };
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
