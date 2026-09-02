import Link from "next/link";
import type { PageMeta } from "@/lib/pagination";

type Props = {
  meta: PageMeta;
  /** Path the links point at, e.g. "/results". Used with the default `?page=N` scheme. */
  basePath?: string;
  /** Other query params to carry across page changes (e.g. active filters). */
  query?: Record<string, string | number | undefined | null>;
  /** Full override: given a page number, return its href. Use for segment routes (/blog/page/2). */
  pageHref?: (page: number) => string;
  className?: string;
};

/** Builds `${basePath}?<query>&page=N`, dropping `page` when N === 1 so page 1 stays canonical. */
function queryHref(basePath: string, query: Props["query"], page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") sp.set(key, String(value));
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function makeHrefForPage({ basePath, query, pageHref }: Props): (page: number) => string {
  if (pageHref) return pageHref;
  if (!basePath) throw new Error("<Pagination> needs either `basePath` or `pageHref`");
  return (page) => queryHref(basePath, query, page);
}

/** Compact page-number window: 1 … p-1 p p+1 … last (no gaps when the list is short). */
function pageWindow(page: number, pageCount: number): number[] {
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
}

const linkBase =
  "inline-flex min-w-9 items-center justify-center rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm tabular-nums transition-colors hover:border-brand hover:text-ink";

export function Pagination(props: Props) {
  const { meta, className } = props;
  if (meta.pageCount <= 1) return null;
  const hrefForPage = makeHrefForPage(props);
  const windowed = pageWindow(meta.page, meta.pageCount);

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className ?? ""}`}
    >
      {meta.hasPrev ? (
        <Link href={hrefForPage(meta.page - 1)} rel="prev" className={linkBase}>
          ← Prev
        </Link>
      ) : (
        <span className={`${linkBase} cursor-not-allowed opacity-40 hover:border-line hover:text-current`}>← Prev</span>
      )}

      {windowed.map((p, i) => {
        const gap = i > 0 && p - windowed[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-faint">…</span>}
            {p === meta.page ? (
              <span aria-current="page" className={`${linkBase} border-brand bg-brand/10 font-semibold text-ink`}>
                {p}
              </span>
            ) : (
              <Link href={hrefForPage(p)} className={linkBase}>
                {p}
              </Link>
            )}
          </span>
        );
      })}

      {meta.hasNext ? (
        <Link href={hrefForPage(meta.page + 1)} rel="next" className={linkBase}>
          Next →
        </Link>
      ) : (
        <span className={`${linkBase} cursor-not-allowed opacity-40 hover:border-line hover:text-current`}>Next →</span>
      )}
    </nav>
  );
}
