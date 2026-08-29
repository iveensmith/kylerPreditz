import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FixtureStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { getMatchDetail, matchSlug } from "@/lib/queries/match-detail";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { buildSportsEventJsonLd } from "@/lib/structured-data";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { MatchStatus } from "@/components/ui/MatchStatus";
import { TeamFormList } from "@/components/match/TeamFormList";
import { H2hTable } from "@/components/match/H2hTable";
import { MarketProbabilityTable } from "@/components/match/MarketProbabilityTable";
import { JsonLd } from "@/components/seo/JsonLd";

// Backstop only: sync-results revalidates this route as soon as a fixture
// changes status, so the live/final line refreshes well inside this window.
export const revalidate = 120;

export async function generateStaticParams() {
  const fixtures = await prisma.fixture.findMany({
    where: { prediction: { isNot: null } },
    select: { id: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  });
  return fixtures.map((f) => ({ id: f.id, slug: matchSlug(f.homeTeam.name, f.awayTeam.name) }));
}

type Props = { params: Promise<{ id: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, slug } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) return {};
  const { homeTeam, awayTeam, league } = detail.fixture;
  const description = `${homeTeam.name} vs ${awayTeam.name} prediction, odds, and confidence rating - ${league.name}.`;
  const url = absoluteUrl(`/predictions/${id}/${slug}`);
  return {
    title: `${homeTeam.name} vs ${awayTeam.name} Prediction`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${homeTeam.name} vs ${awayTeam.name}`, description, url, type: "article" },
  };
}

export default async function MatchDetailPage({ params }: Props) {
  const { id, slug } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) notFound();

  const { fixture, homeStats, awayStats, h2h } = detail;
  const { homeTeam, awayTeam, league, prediction } = fixture;

  return (
    <main className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <JsonLd
        data={buildSportsEventJsonLd({
          homeTeam: homeTeam.name,
          awayTeam: awayTeam.name,
          league: league.name,
          kickoffUtc: fixture.kickoffUtc,
          venue: fixture.venue,
          url: absoluteUrl(`/predictions/${id}/${slug}`),
        })}
      />
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
          <span>
            {league.name} - {formatKickoffTime(fixture.kickoffUtc)}
            {fixture.venue ? ` - ${fixture.venue}` : ""}
          </span>
          {fixture.status !== FixtureStatus.SCHEDULED && (
            <MatchStatus
              status={fixture.status}
              elapsedMinutes={fixture.elapsedMinutes}
              kickoffUtc={fixture.kickoffUtc}
              homeScore={fixture.homeScore}
              awayScore={fixture.awayScore}
            />
          )}
        </p>
        <h1 className="text-xl font-semibold flex flex-col gap-1">
          <TeamBadge name={homeTeam.name} logoUrl={homeTeam.logoUrl} size={24} />
          <span className="text-sm font-normal text-zinc-400">vs</span>
          <TeamBadge name={awayTeam.name} logoUrl={awayTeam.logoUrl} size={24} />
        </h1>
      </div>

      {prediction && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium">{formatMarketLabel(prediction.market)}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{prediction.selection}</div>
            </div>
            <span className="inline-flex items-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-2.5 py-1 text-sm font-medium tabular-nums">
              {prediction.confidence}%
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{prediction.reasoning}</p>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2 text-sm">All Markets</h2>
        <MarketProbabilityTable allMarkets={prediction?.allMarkets ?? null} publishedMarket={prediction?.market ?? null} />
      </section>

      <section className="grid grid-cols-2 gap-6">
        <TeamFormList teamName={homeTeam.name} stats={homeStats} />
        <TeamFormList teamName={awayTeam.name} stats={awayStats} />
      </section>

      <section>
        <h2 className="font-semibold mb-2 text-sm">Goals For / Against (per match)</h2>
        <table className="w-full text-sm">
          <thead className="text-zinc-500 dark:text-zinc-400 text-xs">
            <tr>
              <th className="text-left font-medium py-1">Team</th>
              <th className="text-right font-medium py-1">For</th>
              <th className="text-right font-medium py-1">Against</th>
              <th className="text-right font-medium py-1">League Pos.</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5">{homeTeam.name}</td>
              <td className="py-1.5 text-right tabular-nums">{homeStats.goalsForAvg}</td>
              <td className="py-1.5 text-right tabular-nums">{homeStats.goalsAgainstAvg}</td>
              <td className="py-1.5 text-right tabular-nums">{homeStats.leaguePosition ?? "-"}</td>
            </tr>
            <tr className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5">{awayTeam.name}</td>
              <td className="py-1.5 text-right tabular-nums">{awayStats.goalsForAvg}</td>
              <td className="py-1.5 text-right tabular-nums">{awayStats.goalsAgainstAvg}</td>
              <td className="py-1.5 text-right tabular-nums">{awayStats.leaguePosition ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold mb-2 text-sm">Head to Head</h2>
        <H2hTable entries={h2h} />
      </section>

      <section className="text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p>Predictions are statistical estimates, capped at 92% confidence, never guaranteed.</p>
      </section>
    </main>
  );
}
