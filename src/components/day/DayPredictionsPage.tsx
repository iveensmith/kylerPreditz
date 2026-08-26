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
    <main className="max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">{dayName} Predictions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDayMonth(date)}</p>
      </div>

      {leagues.length > 0 ? (
        <div className="flex flex-col gap-4">
          {leagues.map((league) => (
            <LeagueTipGroup key={league.id} league={league} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No fixtures tracked for {dayName.toLowerCase()} yet.</p>
      )}

      <section className="text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p>
          Predictions are statistical estimates, capped at 92% confidence, never guaranteed. Every published tip
          stays on the public record.
        </p>
      </section>
    </main>
  );
}
