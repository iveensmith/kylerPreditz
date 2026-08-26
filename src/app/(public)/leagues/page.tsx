import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getLeagueIndex } from "@/lib/queries/league-detail";
import { slugify } from "@/lib/slugs";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const DESCRIPTION = "Fixtures, tables, and top scorers for every league we track.";

export const metadata: Metadata = {
  title: "Leagues",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/leagues") },
  openGraph: { title: "Leagues | kylerPredictz", description: DESCRIPTION, url: absoluteUrl("/leagues") },
};

export default async function LeaguesIndexPage() {
  const leagues = await getLeagueIndex();

  return (
    <main className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Leagues</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {leagues.map((league) => (
          <Link
            key={league.id}
            href={`/leagues/${slugify(league.country)}/${league.slug}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            {league.logoUrl && <Image src={league.logoUrl} alt={`${league.name} logo`} width={32} height={32} />}
            <div>
              <div className="font-medium text-sm">{league.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{league.country}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
