import { renderPostBody } from "@/lib/markdown";

/** Renders sanitized post Markdown. Output is allowlist-sanitized in renderPostBody. */
export function PostBody({ body, sponsored }: { body: string; sponsored: boolean }) {
  const html = renderPostBody(body, { sponsored });
  return (
    <article
      className="prose prose-zinc max-w-none dark:prose-invert
        prose-headings:font-display prose-headings:tracking-[-0.015em]
        prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl
        prose-p:text-[1.0625rem] prose-p:leading-relaxed
        prose-a:font-medium prose-a:text-brand prose-a:no-underline hover:prose-a:underline
        prose-strong:text-ink
        prose-blockquote:border-l-2 prose-blockquote:border-brand prose-blockquote:not-italic prose-blockquote:text-muted
        prose-code:rounded prose-code:bg-surface-2 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
        prose-img:rounded-[var(--radius-card)] prose-img:border prose-img:border-line"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
