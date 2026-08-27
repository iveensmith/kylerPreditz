import type { Metadata } from "next";
import { parseDateParam } from "@/lib/format";
import {
  getBankerOfTheDay,
  getFixturesForDate,
  getRecentWinningTips,
  getStandingsForFeaturedLeagues,
  getTopScorersForFeaturedLeagues,
} from "@/lib/queries/homepage";
import { HOMEPAGE_FAQ } from "@/lib/faq.config";
import { buildFaqPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { MarketSidebar } from "@/components/home/MarketSidebar";
import { DateStrip } from "@/components/home/DateStrip";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";
import { TipOfTheDayCard } from "@/components/home/TipOfTheDayCard";
import { RecentWinners } from "@/components/home/RecentWinners";
import { LeagueTablesTabs } from "@/components/home/LeagueTablesTabs";
import { TopScorersTable } from "@/components/home/TopScorersTable";
import { FaqSection } from "@/components/home/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";

const DESCRIPTION =
  "Today's football predictions with suggested betting markets, odds, and model-generated confidence, across the Premier League, La Liga, Serie A, Bundesliga, and Ligue 1.";

export const metadata: Metadata = {
  // absolute bypasses the root layout's `%s | SITE_NAME` template - this title already
  // includes the site name, so the template would otherwise duplicate it in the tab title.
  title: { absolute: `${SITE_NAME} - ${SITE_TAGLINE}` },
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: { title: `${SITE_NAME} - ${SITE_TAGLINE}`, description: DESCRIPTION, url: absoluteUrl("/") },
};

export const revalidate = 900; // 15 minutes, matches sync-results cadence

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDate = parseDateParam(dateParam);

  const [leagues, banker, recentWinners, standings, topScorers] = await Promise.all([
    getFixturesForDate(selectedDate),
    getBankerOfTheDay(selectedDate),
    getRecentWinningTips(),
    getStandingsForFeaturedLeagues(),
    getTopScorersForFeaturedLeagues(),
  ]);

  return (
    <>
      <JsonLd data={buildFaqPageJsonLd(HOMEPAGE_FAQ)} />
      <Hero />

      <main id="todays-tips" className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-6">
        {banker && <TipOfTheDayCard banker={banker} />}

        <div className="flex-1 min-w-0 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Today&apos;s Football Predictions</h2>
            <MarketSidebar />
            <DateStrip selectedDate={selectedDate} />
          </div>

          {leagues.length > 0 ? (
            <div className="flex flex-col gap-4">
              {leagues.map((league) => (
                <LeagueTipGroup key={league.id} league={league} />
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">No fixtures tracked for this date yet.</p>
          )}

          <RecentWinners tips={recentWinners} />

          <LeagueTablesTabs leagues={standings} />

          <TopScorersTable leagues={topScorers} />

          <section className="text-sm text-zinc-600 dark:text-zinc-300 space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                A Football Prediction Site Built on a Real Model
              </h2>
              <p>
                Most prediction sites publish a tip next to a team name with no explanation of where it came from.{" "}
                {SITE_NAME} works differently: every pick starts as the output of a Poisson/Dixon-Coles statistical
                model, weighted toward each team&apos;s recent home and away form, then reviewed by an AI layer that
                can only adjust the pick when the underlying data gives it a concrete reason to.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How Confidence Is Calculated</h3>
              <p>
                The confidence percentage next to each tip is the model&apos;s estimated probability for that
                selection, not a marketing number. It&apos;s capped at 92% regardless of what the model or the AI
                review produces - nothing on this site is ever presented as a certainty.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Markets We Cover</h3>
              <p>
                Beyond the traditional 1X2 match winner market, {SITE_NAME} derives probabilities for double
                chance, both teams to score, over/under goals at multiple thresholds, draw no bet, correct score, and
                first-half goals - all from the same underlying score matrix, so every market for a fixture is
                internally consistent with every other market for that fixture.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Why Some Matches Have No Tip</h3>
              <p>
                If no market clears our confidence floor for a fixture, or a team doesn&apos;t yet have enough recent
                match history for the model to trust, we publish nothing for that match rather than force a low-
                quality pick. An empty slot is better than a bad tip.
              </p>
            </div>
          </section>

          <FaqSection entries={HOMEPAGE_FAQ} />
        </div>
      </main>
    </>
  );
}
