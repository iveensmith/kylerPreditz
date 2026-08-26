import { notFound } from "next/navigation";
import { getPredictionForAdmin } from "@/lib/queries/admin";
import { updateTip } from "@/lib/actions/tips";
import { formatMarketLabel } from "@/lib/format";
import { PredictionMarket } from "@/generated/prisma/enums";

type Props = { params: Promise<{ id: string }> };

export default async function EditTipPage({ params }: Props) {
  const { id } = await params;
  const prediction = await getPredictionForAdmin(id);
  if (!prediction) notFound();

  const updateTipWithId = updateTip.bind(null, id);

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-xl font-semibold">
        Edit Tip - {prediction.fixture.homeTeam.name} vs {prediction.fixture.awayTeam.name}
      </h1>

      <form action={updateTipWithId} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Market</span>
          <select name="market" defaultValue={prediction.market} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2">
            {Object.values(PredictionMarket).map((m) => (
              <option key={m} value={m}>
                {formatMarketLabel(m)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Selection</span>
          <input name="selection" defaultValue={prediction.selection} required className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Odds</span>
            <input
              name="odds"
              type="number"
              step="0.01"
              min="1"
              defaultValue={prediction.odds.toString()}
              required
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Confidence (%)</span>
            <input
              name="confidence"
              type="number"
              min="0"
              max="100"
              defaultValue={prediction.confidence}
              required
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Reasoning</span>
          <textarea
            name="reasoning"
            defaultValue={prediction.reasoning}
            required
            rows={4}
            className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </label>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isVip" defaultChecked={prediction.isVip} />
            VIP
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isBanker" defaultChecked={prediction.isBanker} />
            Banker of the Day
          </label>
        </div>

        <button type="submit" className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 font-medium self-start">
          Save Changes
        </button>
      </form>
    </div>
  );
}
