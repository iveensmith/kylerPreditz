import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getLeagueIndex } from "@/lib/queries/league-detail";
import { slugify } from "@/lib/slugs";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

const DESCRIPTION = "Fixtures, tables, and top scorers for every league we track.";

export const metadata: Metadata = {
  title: "Leagues",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/leagues") },
  openGraph: { title: `Leagues | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/leagues") },
};

export default async function LeaguesIndexPage() {
  const leagues = await getLeagueIndex();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="border-b border-line pb-5">
        <div className="eyebrow mb-2">Coverage</div>
        <h1 className="text-[2rem] leading-[1.05] sm:text-4xl">Leagues</h1>
        <p className="mt-3 text-[15px] text-muted">Fixtures, tables, and top scorers for every league we track.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {leagues.map((league) => (
          <Link
            key={league.id}
            href={`/leagues/${slugify(league.country)}/${league.slug}`}
            className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line p-4 transition-colors hover:border-brand hover:bg-surface-2"
          >
            {league.logoUrl && <Image src={league.logoUrl} alt="" width={30} height={30} />}
            <div>
              <div className="text-sm font-semibold">{league.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-faint">{league.country}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
