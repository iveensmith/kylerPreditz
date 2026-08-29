import type { Metadata } from "next";
import Link from "next/link";
import { parseDateParam } from "@/lib/format";
import {
  getBankerOfTheDay,
  getFixturesForDate,
  getRecentWinningTips,
  getStandingsForFeaturedLeagues,
  getTopScorersForFeaturedLeagues,
} from "@/lib/queries/homepage";
import { getLatestListedPosts } from "@/lib/queries/blog";
import { HOMEPAGE_FAQ } from "@/lib/faq.config";
import { buildFaqPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { MarketSidebar } from "@/components/home/MarketSidebar";
import { DateStrip } from "@/components/home/DateStrip";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";
import { TipOfTheDayCard } from "@/components/home/TipOfTheDayCard";
import { SidebarFixtureList } from "@/components/home/SidebarFixtureList";
import { RecentWinners } from "@/components/home/RecentWinners";
import { LeagueTablesTabs } from "@/components/home/LeagueTablesTabs";
import { TopScorersTable } from "@/components/home/TopScorersTable";
import { LatestPosts } from "@/components/home/LatestPosts";
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

// Backstop only: sync-results calls revalidatePath("/") the moment a fixture
// changes status, so live scores refresh well inside this window.
export const revalidate = 120;

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDate = parseDateParam(dateParam);

  const [leagues, banker, recentWinners, standings, topScorers, latestPosts] = await Promise.all([
    getFixturesForDate(selectedDate),
    getBankerOfTheDay(selectedDate),
    getRecentWinningTips(),
    getStandingsForFeaturedLeagues(),
    getTopScorersForFeaturedLeagues(),
    getLatestListedPosts(4),
  ]);

  // Fills the space below the sticky Tip of the Day card on desktop, where a
  // stretched flex sidebar would otherwise just be empty background. Reuses
  // the fixtures already fetched above rather than a second query.
  const sidebarFixtures = leagues
    .flatMap((league) => league.fixtures)
    .filter((fixture) => fixture.id !== banker?.fixture.id)
    .sort((a, b) => a.kickoffUtc.getTime() - b.kickoffUtc.getTime())
    .slice(0, 10);

  return (
    <>
      <JsonLd data={buildFaqPageJsonLd(HOMEPAGE_FAQ)} />
      <Hero />

      <main id="todays-tips" className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-6">
        {banker && (
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-6">
            <TipOfTheDayCard banker={banker} />
            <SidebarFixtureList fixtures={sidebarFixtures} />
          </div>
        )}

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

          <LatestPosts posts={latestPosts} />

          <LeagueTablesTabs leagues={standings} />

          <TopScorersTable leagues={topScorers} />

          <section className="text-sm text-zinc-600 dark:text-zinc-300 space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                A Football Prediction Site Built on a Real Model
              </h2>
              <p>
                Most prediction sites publish a tip next to a team name and leave you to guess where it came from.{" "}
                {SITE_NAME} works differently. Every selection on this page is the output of a single statistical
                model that reads each team&apos;s recent results and turns them into a probability for every betting
                market on the fixture. There is no tipster picking favourites by feel, and no pick is published
                unless the numbers behind it are strong enough to stand on their own.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How the Model Works</h3>
              <p>
                For each team we measure attack strength - goals scored relative to the league average - and defence
                strength - goals conceded relative to the league average - calculated separately for home matches and
                away matches, because most sides are meaningfully better in one than the other. Those strengths give
                an expected goals figure for each team in the fixture, which becomes a Poisson distribution over how
                many goals they are likely to score. We then apply a Dixon-Coles adjustment, which corrects a known
                weakness of raw Poisson: it underrates tight, low-scoring results like 0-0, 1-0 and 1-1.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Recent Form Counts for More</h3>
              <p>
                A result from last week tells you more about a team than a result from six months ago, so the model
                weights matches by recency on an exponential curve with a half-life of roughly eight to ten games.
                Early-season form, a new manager bounce, or a mid-table side that has quietly won five in a row all
                show up in the numbers quickly rather than being diluted by a full season of older data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">One Score Matrix, Every Market</h3>
              <p>
                The two Poisson distributions combine into a single grid of every plausible scoreline and its
                probability. Every market we publish - 1X2, double chance, over and under goals at 1.5, 2.5 and 3.5,
                both teams to score, draw no bet, correct score and first-half goals - is read straight off that one
                grid by adding up the relevant cells. Because they all come from the same source, the markets for a
                fixture never contradict each other, and the tip we show is simply the one the grid rates highest.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How Confidence Is Calculated</h3>
              <p>
                The confidence percentage next to each tip is the model&apos;s estimated probability for that exact
                selection, rounded to a whole number - not a marketing figure. The odds shown are the fair price
                implied by that probability. Confidence is capped at 92% no matter how lopsided the fixture looks,
                and a 92% pick still loses roughly one time in twelve. Nothing on this site is presented as a
                certainty.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Why Some Matches Have No Tip</h3>
              <p>
                A fixture only gets a published tip if its best market clears our confidence floor. If nothing does,
                or if one of the teams has played too few recent matches for the model to read them reliably - a
                promoted side early in the season, for example - we publish nothing for that match. An empty slot is
                more useful than a low-quality pick padding out the list.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Every Result Stays on the Site</h3>
              <p>
                Once a match finishes, the tip is settled as a win or a loss and moved to the{" "}
                <Link href="/results" className="text-brand hover:underline">
                  results archive
                </Link>
                , where it stays permanently. Losing tips are never deleted or quietly edited. The point of showing
                the model&apos;s working is that you can check how it has actually performed, not just take our word
                for it.
              </p>
            </div>
          </section>

          <FaqSection entries={HOMEPAGE_FAQ} />
        </div>
      </main>
    </>
  );
}
