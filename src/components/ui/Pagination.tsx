import Link from "next/link";
import type { PageMeta } from "@/lib/pagination";

type Props = {
  meta: PageMeta;
  /** Path the links point at, e.g. "/results". */
  basePath: string;
  /** Other query params to carry across page changes (e.g. active filters). */
  query?: Record<string, string | number | undefined | null>;
  className?: string;
};

/** Builds `${basePath}?<query>&page=N`, dropping `page` when N === 1 so page 1 stays canonical. */
function hrefForPage(basePath: string, query: Props["query"], page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") sp.set(key, String(value));
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Compact page-number window: 1 … p-1 p p+1 … last (no gaps when the list is short). */
function pageWindow(page: number, pageCount: number): number[] {
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
}

const linkBase =
  "inline-flex min-w-9 items-center justify-center rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm tabular-nums transition-colors hover:border-brand hover:text-ink";

export function Pagination({ meta, basePath, query, className }: Props) {
  if (meta.pageCount <= 1) return null;
  const windowed = pageWindow(meta.page, meta.pageCount);

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className ?? ""}`}
    >
      {meta.hasPrev ? (
        <Link href={hrefForPage(basePath, query, meta.page - 1)} rel="prev" className={linkBase}>
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
              <Link href={hrefForPage(basePath, query, p)} className={linkBase}>
                {p}
              </Link>
            )}
          </span>
        );
      })}

      {meta.hasNext ? (
        <Link href={hrefForPage(basePath, query, meta.page + 1)} rel="next" className={linkBase}>
          Next →
        </Link>
      ) : (
        <span className={`${linkBase} cursor-not-allowed opacity-40 hover:border-line hover:text-current`}>Next →</span>
      )}
    </nav>
  );
}
