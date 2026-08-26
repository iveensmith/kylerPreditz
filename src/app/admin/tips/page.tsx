import Link from "next/link";
import { getAllPredictionsForAdmin } from "@/lib/queries/admin";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { DeleteTipButton } from "@/components/admin/DeleteTipButton";

export default async function AdminTipsPage() {
  const predictions = await getAllPredictionsForAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tips</h1>
        <Link href="/admin/tips/new" className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 text-sm font-medium">
          New Manual Tip
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs">
            <tr>
              <th className="text-left font-medium px-3 py-2">Kickoff</th>
              <th className="text-left font-medium px-3 py-2">Match</th>
              <th className="text-left font-medium px-3 py-2">Tip</th>
              <th className="text-right font-medium px-3 py-2">Confidence</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-left font-medium px-3 py-2">Flags</th>
              <th className="text-right font-medium px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 whitespace-nowrap tabular-nums text-zinc-500 dark:text-zinc-400">
                  {formatKickoffTime(p.fixture.kickoffUtc)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.fixture.homeTeam.name} vs {p.fixture.awayTeam.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatMarketLabel(p.market)} - {p.selection}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{p.confidence}%</td>
                <td className="px-3 py-2">{p.settledAs}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                  {p.isVip && "VIP "}
                  {p.isBanker && "Banker "}
                  {p.isManualOverride && "Edited"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/tips/${p.id}`} className="underline mr-3">
                    Edit
                  </Link>
                  <DeleteTipButton id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
