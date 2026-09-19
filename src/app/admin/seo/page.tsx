import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import sitemap from "@/app/sitemap";
import { SEO_PAGES } from "@/lib/seo-pages.config";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/page-seo";
import { savePageSeo } from "@/lib/actions/seo";
import { absoluteUrl } from "@/lib/seo";
import { adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

function bucket(url: string): string {
  const path = new URL(url).pathname;
  if (path.startsWith("/predictions/")) return "Match pages";
  if (path.startsWith("/leagues/")) return "League pages";
  if (path.startsWith("/blog/")) return "Blog posts";
  return "Other pages";
}

export default async function AdminSeoPage() {
  const [overrides, entries] = await Promise.all([prisma.pageSeo.findMany(), sitemap()]);
  const byPath = new Map(overrides.map((o) => [o.path, o]));
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(bucket(e.url), (counts.get(bucket(e.url)) ?? 0) + 1);

  const groups = ["Main", "Days", "Markets"] as const;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <AdminHeader eyebrow="Search" title="SEO" />

      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line p-4">
        <h2 className="text-sm font-semibold">Sitemap &amp; indexing</h2>
        <p className="text-sm text-muted">
          <span className="font-mono font-semibold text-ink">{entries.length}</span> URLs in the sitemap:{" "}
          {[...counts.entries()].map(([k, v]) => `${v} ${k.toLowerCase()}`).join(" · ")}. Match pages are listed only for
          upcoming games and the last 7 days.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href={absoluteUrl("/sitemap.xml")} target="_blank" rel="noopener" className="text-brand underline">Open sitemap.xml ↗</a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="text-brand underline">Search Console ↗</a>
          <Link href="/robots.txt" target="_blank" className="text-brand underline">robots.txt ↗</Link>
        </div>
      </section>

      <div>
        <h2 className="text-sm font-semibold">Page titles &amp; descriptions</h2>
        <p className="mt-1 text-xs text-muted">
          What Google shows in search results. Leave both fields blank to use the page&apos;s built-in text. Titles: up to{" "}
          {TITLE_MAX} characters (the site name is added automatically, except on the homepage). Descriptions: up to{" "}
          {DESCRIPTION_MAX}.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group} className="flex flex-col gap-2">
          <div className="eyebrow">{group === "Days" ? "Day pages" : group === "Markets" ? "Market pages" : "Main pages"}</div>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
            {SEO_PAGES.filter((p) => p.group === group).map((page) => {
              const o = byPath.get(page.path);
              const customised = Boolean(o?.title || o?.description);
              return (
                <details key={page.path} className="border-b border-line last:border-b-0">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span>
                      <span className="font-medium">{page.label}</span>
                      <span className="ml-2 font-mono text-[11px] text-faint">{page.path}</span>
                    </span>
                    {customised && (
                      <span className="rounded bg-brand/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-brand">Custom</span>
                    )}
                  </summary>
                  <ActionForm
                    action={savePageSeo.bind(null, page.path)}
                    submitLabel="Save"
                    className="flex flex-col gap-3 border-t border-line bg-surface-2 px-4 py-4"
                  >
                    <label className={adminLabel}>
                      <span className={adminLabelText}>Title</span>
                      <input name="title" defaultValue={o?.title ?? ""} maxLength={TITLE_MAX} placeholder="Default title" className={adminInput} />
                    </label>
                    <label className={adminLabel}>
                      <span className={adminLabelText}>Meta description</span>
                      <textarea name="description" defaultValue={o?.description ?? ""} maxLength={DESCRIPTION_MAX} rows={3} placeholder="Default description" className={adminInput} />
                    </label>
                  </ActionForm>
                </details>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
