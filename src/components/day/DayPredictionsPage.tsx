import { getFixturesForDate } from "@/lib/queries/homepage";
import { nextOccurrenceOfWeekday } from "@/lib/queries/day-predictions";
import { formatDayMonth } from "@/lib/format";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";
import { MatchListJsonLd } from "@/components/seo/MatchListJsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Shared template for the 7 static `[day]-predictions` pages - only the weekday index differs per page. */
export async function DayPredictionsPage({ weekday }: { weekday: number }) {
  const date = nextOccurrenceOfWeekday(weekday);
  const leagues = await getFixturesForDate(date);
  const dayName = WEEKDAY_NAMES[weekday];
  const slug = `${dayName.toLowerCase()}-predictions`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <MatchListJsonLd leagues={leagues} />
      <header className="border-b border-line pb-4">
        <Breadcrumbs
          className="mb-4"
          items={[
            { name: "Home", href: "/" },
            { name: `${dayName} Predictions`, href: `/${slug}` },
          ]}
        />
        <div className="eyebrow mb-1.5">{formatDayMonth(date)}</div>
        <h1 className="text-[2rem] leading-[1.05] sm:text-4xl">{dayName} predictions</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          {dayName}&rsquo;s fixtures across every competition we cover, each with our model&rsquo;s suggested
          market, the derived odds, and a confidence rating capped at 92%. Predictions publish around 48 hours
          before kickoff, and this page updates as results settle.
        </p>
      </header>

      {leagues.length > 0 ? (
        <div className="flex flex-col gap-4">
          {leagues.map((league) => (
            <LeagueTipGroup key={league.id} league={league} />
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm">No fixtures tracked for {dayName.toLowerCase()} yet.</p>
      )}

      <section className="border-t border-line pt-6 text-sm text-muted">
        <p>
          Predictions are statistical estimates, capped at 92% confidence, never guaranteed. Every published tip
          stays on the public record.
        </p>
      </section>
    </main>
  );
}
