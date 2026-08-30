import type { Metadata } from "next";
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
import { HowItWorks } from "@/components/home/HowItWorks";
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

        <div className="flex-1 min-w-0 flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <div className="border-b border-line pb-3">
              <div className="eyebrow mb-1.5">Fixtures &amp; tips</div>
              <h2 className="text-xl leading-tight sm:text-[1.375rem]">Today&apos;s football predictions</h2>
            </div>
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
            <p className="text-muted text-sm">No fixtures tracked for this date yet.</p>
          )}

          <RecentWinners tips={recentWinners} />

          <LatestPosts posts={latestPosts} />

          <LeagueTablesTabs leagues={standings} />

          <TopScorersTable leagues={topScorers} />

          <HowItWorks />

          <FaqSection entries={HOMEPAGE_FAQ} />
        </div>
      </main>
    </>
  );
}
