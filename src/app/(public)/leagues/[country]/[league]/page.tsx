import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLeagueBySlug, getLeagueIndex } from "@/lib/queries/league-detail";
import { slugify } from "@/lib/slugs";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";
import { StandingsTable } from "@/components/league/StandingsTable";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const revalidate = 900;

export async function generateStaticParams() {
  const leagues = await getLeagueIndex();
  return leagues.map((l) => ({ country: slugify(l.country), league: l.slug }));
}

type Props = { params: Promise<{ country: string; league: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, league: slug } = await params;
  const league = await getLeagueBySlug(slug);
  if (!league) return {};
  const description = `${league.name} fixtures, table, and top scorers - ${league.country}.`;
  const url = absoluteUrl(`/leagues/${country}/${slug}`);
  return {
    title: league.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${league.name} | ${SITE_NAME}`, description, url },
  };
}

export default async function LeagueDetailPage({ params }: Props) {
  const { league: slug } = await params;
  const league = await getLeagueBySlug(slug);
  if (!league) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="flex items-center gap-4 border-b border-line pb-5">
        {league.logoUrl && <Image src={league.logoUrl} alt="" width={40} height={40} />}
        <div>
          <div className="eyebrow mb-1">{league.country}</div>
          <h1 className="text-[2rem] leading-none sm:text-4xl">{league.name}</h1>
        </div>
      </header>

      <section>
        <SectionHeading eyebrow="Next 7 days" title="Upcoming fixtures" />
        {league.fixtures.length > 0 ? (
          <LeagueTipGroup league={league} />
        ) : (
          <p className="text-sm text-muted">No upcoming fixtures tracked yet.</p>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="Standings" title="Table" />
        <StandingsTable rows={league.standings} />
      </section>

      {league.topScorers.length > 0 && (
        <section>
          <SectionHeading eyebrow="This season" title="Top scorers" />
          <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line text-sm">
            {league.topScorers.map((scorer, i) => (
              <li
                key={scorer.id}
                className="flex items-center gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0"
              >
                <span className="w-4 shrink-0 text-right font-mono text-xs text-faint">{i + 1}</span>
                <PlayerAvatar name={scorer.playerName} photoUrl={scorer.photoUrl} size={28} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{scorer.playerName}</span>
                  <TeamBadge name={scorer.team.name} logoUrl={scorer.team.logoUrl} size={14} />
                </div>
                <span className="ml-auto shrink-0 font-mono font-semibold tabular-nums">{scorer.goals}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
