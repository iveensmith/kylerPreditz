import Link from "next/link";
import { getAllPredictionsForAdmin } from "@/lib/queries/admin";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { DeleteTipButton } from "@/components/admin/DeleteTipButton";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminBtnLink } from "@/lib/admin-ui";

export default async function AdminTipsPage() {
  const predictions = await getAllPredictionsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader
        title="Tips"
        action={
          <Link href="/admin/tips/new" className={adminBtnLink}>
            New manual tip
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
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
              <tr key={p.id} className="border-t border-line">
                <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-muted">
                  {formatKickoffTime(p.fixture.kickoffUtc)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {p.fixture.homeTeam.name} vs {p.fixture.awayTeam.name}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatMarketLabel(p.market)} &middot; {p.selection}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{p.confidence}%</td>
                <td className="px-3 py-2 font-mono text-xs uppercase text-muted">{p.settledAs}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                  {[p.isVip && "VIP", p.isBanker && "Banker", p.isManualOverride && "Edited"]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Link href={`/admin/tips/${p.id}`} className="mr-3 text-brand underline">
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
