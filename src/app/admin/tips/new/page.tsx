import { getSkippedFixtures } from "@/lib/queries/admin";
import { createManualTip } from "@/lib/actions/tips";
import { formatKickoffTime, formatMarketLabel } from "@/lib/format";
import { PredictionMarket } from "@/generated/prisma/enums";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminInput, adminLabel, adminLabelText, adminBtn } from "@/lib/admin-ui";

export default async function NewManualTipPage() {
  const fixtures = await getSkippedFixtures();

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <AdminHeader eyebrow="Tips" title="New manual tip" />
      <p className="text-sm text-muted">
        Fixtures the engine skipped (no market cleared the confidence floor, or not enough match history).
      </p>

      {fixtures.length === 0 ? (
        <p className="text-sm text-muted">No skipped upcoming fixtures right now.</p>
      ) : (
        <form action={createManualTip} className="flex flex-col gap-4">
          <label className={adminLabel}>
            <span className={adminLabelText}>Fixture</span>
            <select name="fixtureId" required className={adminInput}>
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {formatKickoffTime(f.kickoffUtc)} - {f.league.name} - {f.homeTeam.name} vs {f.awayTeam.name}
                </option>
              ))}
            </select>
          </label>

          <label className={adminLabel}>
            <span className={adminLabelText}>Market</span>
            <select name="market" required className={adminInput}>
              {Object.values(PredictionMarket).map((m) => (
                <option key={m} value={m}>
                  {formatMarketLabel(m)}
                </option>
              ))}
            </select>
          </label>

          <label className={adminLabel}>
            <span className={adminLabelText}>Selection</span>
            <input name="selection" required placeholder="e.g. Over 2.5" className={adminInput} />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={adminLabel}>
              <span className={adminLabelText}>Odds</span>
              <input name="odds" type="number" step="0.01" min="1" required className={adminInput} />
            </label>
            <label className={adminLabel}>
              <span className={adminLabelText}>Confidence (%)</span>
              <input name="confidence" type="number" min="0" max="100" required className={adminInput} />
            </label>
          </div>

          <label className={adminLabel}>
            <span className={adminLabelText}>Reasoning</span>
            <textarea name="reasoning" required rows={4} className={adminInput} />
          </label>

          <button type="submit" className={adminBtn}>
            Create Tip
          </button>
        </form>
      )}
    </div>
  );
}
