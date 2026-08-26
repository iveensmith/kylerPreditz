import { getSkippedFixtures } from "@/lib/queries/admin";
import { createManualTip } from "@/lib/actions/tips";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { PredictionMarket } from "@/generated/prisma/enums";

export default async function NewManualTipPage() {
  const fixtures = await getSkippedFixtures();

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-xl font-semibold">New Manual Tip</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Fixtures the engine skipped (no market cleared the confidence floor, or not enough match history).
      </p>

      {fixtures.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No skipped upcoming fixtures right now.</p>
      ) : (
        <form action={createManualTip} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Fixture</span>
            <select name="fixtureId" required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2">
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {formatKickoffTime(f.kickoffUtc)} - {f.league.name} - {f.homeTeam.name} vs {f.awayTeam.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Market</span>
            <select name="market" required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2">
              {Object.values(PredictionMarket).map((m) => (
                <option key={m} value={m}>
                  {formatMarketLabel(m)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Selection</span>
            <input name="selection" required placeholder="e.g. Over 2.5" className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Odds</span>
              <input name="odds" type="number" step="0.01" min="1" required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Confidence (%)</span>
              <input name="confidence" type="number" min="0" max="100" required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Reasoning</span>
            <textarea name="reasoning" required rows={4} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
          </label>

          <button type="submit" className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 font-medium self-start">
            Create Tip
          </button>
        </form>
      )}
    </div>
  );
}
