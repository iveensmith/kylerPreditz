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
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
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

      <header className="border-b border-line pb-6">
        <div className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{league.name}</span>
          <span aria-hidden>&middot;</span>
          <span>{formatKickoffTime(fixture.kickoffUtc)}</span>
          {fixture.venue && (
            <>
              <span aria-hidden>&middot;</span>
              <span>{fixture.venue}</span>
            </>
          )}
        </div>

        <h1 className="mt-3 text-[1.75rem] leading-tight sm:text-[2.25rem]">
          {homeTeam.name} <span className="text-faint">vs</span> {awayTeam.name}
        </h1>

        <div className="mt-4 flex items-center gap-4">
          <TeamBadge name={homeTeam.name} logoUrl={homeTeam.logoUrl} size={22} />
          <span className="font-mono text-sm text-faint">
            {fixture.status === FixtureStatus.SCHEDULED ? (
              "vs"
            ) : (
              <MatchStatus
                status={fixture.status}
                elapsedMinutes={fixture.elapsedMinutes}
                kickoffUtc={fixture.kickoffUtc}
                homeScore={fixture.homeScore}
                awayScore={fixture.awayScore}
              />
            )}
          </span>
          <TeamBadge name={awayTeam.name} logoUrl={awayTeam.logoUrl} size={22} />
        </div>
      </header>

      {prediction && (
        <section className="rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] p-5">
          <div className="eyebrow !text-brand">Our pick</div>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold">{formatMarketLabel(prediction.market)}</div>
              <div className="text-sm text-muted">{prediction.selection}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-3xl font-semibold leading-none tabular-nums text-brand">
                {prediction.confidence}%
              </div>
              <div className="eyebrow mt-1.5">
                Odds <span className="text-ink">{prediction.odds.toString()}</span>
              </div>
            </div>
          </div>
          {prediction.reasoning && (
            <p className="mt-4 border-t border-brand/20 pt-4 text-sm leading-relaxed text-ink/80">
              {prediction.reasoning}
            </p>
          )}
        </section>
      )}

      <section>
        <SectionHeading eyebrow="One grid, every market" title="Market probabilities" />
        <MarketProbabilityTable
          allMarkets={prediction?.allMarkets ?? null}
          publishedMarket={prediction?.market ?? null}
        />
      </section>

      <section>
        <SectionHeading eyebrow="Last matches" title="Recent form" />
        <div className="grid gap-8 sm:grid-cols-2">
          <TeamFormList teamName={homeTeam.name} stats={homeStats} />
          <TeamFormList teamName={awayTeam.name} stats={awayStats} />
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Per match" title="Goals for & against" />
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Team</th>
                <th className="px-3 py-2 text-right font-medium">For</th>
                <th className="px-3 py-2 text-right font-medium">Against</th>
                <th className="px-3 py-2 text-right font-medium">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {[
                { team: homeTeam.name, s: homeStats },
                { team: awayTeam.name, s: awayStats },
              ].map(({ team, s }) => (
                <tr key={team} className="border-t border-line">
                  <td className="px-3 py-2">{team}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{s.goalsForAvg}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{s.goalsAgainstAvg}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{s.leaguePosition ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Recent meetings" title="Head to head" />
        <H2hTable entries={h2h} />
      </section>

      <p className="border-t border-line pt-5 text-xs text-faint">
        Predictions are statistical estimates, capped at 92% confidence, never guaranteed. 18+ &middot;
        Gamble responsibly.
      </p>
    </main>
  );
}
