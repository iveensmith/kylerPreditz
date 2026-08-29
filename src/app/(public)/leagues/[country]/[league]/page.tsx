import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeagueBySlug, getLeagueIndex } from "@/lib/queries/league-detail";
import { slugify } from "@/lib/slugs";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

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
    <main className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{league.name}</h1>
        <p className="text-sm text-muted">{league.country}</p>
      </div>

      <section>
        <h2 className="font-semibold mb-2 text-sm">Upcoming Fixtures</h2>
        {league.fixtures.length > 0 ? (
          <LeagueTipGroup league={league} />
        ) : (
          <p className="text-muted text-sm">No upcoming fixtures tracked yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2 text-sm">Table</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-muted text-xs">
              <tr>
                <th className="text-left font-medium px-3 py-2">#</th>
                <th className="text-left font-medium px-3 py-2">Team</th>
                <th className="text-right font-medium px-3 py-2">P</th>
                <th className="text-right font-medium px-3 py-2">GD</th>
                <th className="text-right font-medium px-3 py-2">Pts</th>
                <th className="text-right font-medium px-3 py-2">Form</th>
              </tr>
            </thead>
            <tbody>
              {league.standings.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-3 py-2 tabular-nums text-muted">{row.rank}</td>
                  <td className="px-3 py-2">
                    <TeamBadge name={row.team.name} logoUrl={row.team.logoUrl} size={16} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.played}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{row.points}</td>
                  <td className="px-3 py-2 text-right text-xs text-muted tabular-nums">
                    {row.team.stats[0]?.form?.slice(-5) ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {league.topScorers.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2 text-sm">Top Scorers</h2>
          <ul className="rounded-xl border border-line text-sm">
            {league.topScorers.map((scorer) => (
              <li
                key={scorer.id}
                className="flex items-center gap-2.5 px-3 py-2 border-b border-line last:border-b-0"
              >
                <PlayerAvatar name={scorer.playerName} photoUrl={scorer.photoUrl} size={28} />
                <div className="flex flex-col min-w-0">
                  <span>{scorer.playerName}</span>
                  <TeamBadge name={scorer.team.name} logoUrl={scorer.team.logoUrl} size={14} />
                </div>
                <span className="tabular-nums font-medium ml-auto">{scorer.goals}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
