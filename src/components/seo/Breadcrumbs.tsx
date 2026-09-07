import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; href: string };

/**
 * Visible breadcrumb trail + matching BreadcrumbList JSON-LD, from one list of
 * crumbs. Root first, current page last - the last crumb renders as plain text
 * (it's the page you're on), the rest as links. `href` is a site path;
 * the JSON-LD gets the absolute form.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <JsonLd data={buildBreadcrumbJsonLd(items.map((c) => ({ name: c.name, url: absoluteUrl(c.href) })))} />
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-faint">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-muted">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="transition-colors hover:text-ink">
                  {c.name}
                </Link>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
