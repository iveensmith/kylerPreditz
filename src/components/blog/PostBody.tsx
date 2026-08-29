import { renderPostBody } from "@/lib/markdown";

/** Renders sanitized post Markdown. Output is allowlist-sanitized in renderPostBody. */
export function PostBody({ body, sponsored }: { body: string; sponsored: boolean }) {
  const html = renderPostBody(body, { sponsored });
  return (
    <article
      className="prose prose-zinc dark:prose-invert max-w-none prose-a:text-brand prose-a:no-underline hover:prose-a:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
