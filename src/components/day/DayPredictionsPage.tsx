import { getFixturesForDate } from "@/lib/queries/homepage";
import { nextOccurrenceOfWeekday } from "@/lib/queries/day-predictions";
import { formatDayMonth } from "@/lib/format";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Shared template for the 7 static `[day]-predictions` pages - only the weekday index differs per page. */
export async function DayPredictionsPage({ weekday }: { weekday: number }) {
  const date = nextOccurrenceOfWeekday(weekday);
  const leagues = await getFixturesForDate(date);
  const dayName = WEEKDAY_NAMES[weekday];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="border-b border-line pb-4">
        <div className="eyebrow mb-1.5">{formatDayMonth(date)}</div>
        <h1 className="text-[2rem] leading-[1.05] sm:text-4xl">{dayName} predictions</h1>
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
