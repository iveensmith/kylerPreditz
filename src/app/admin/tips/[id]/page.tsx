import { notFound } from "next/navigation";
import { getPredictionForAdmin } from "@/lib/queries/admin";
import { updateTip } from "@/lib/actions/tips";
import { formatMarketLabel } from "@/lib/format";
import { PredictionMarket } from "@/generated/prisma/enums";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminInput, adminLabel, adminLabelText, adminBtn } from "@/lib/admin-ui";
import { PREMIUM_CONFIDENCE_FLOOR } from "@/lib/premium";

type Props = { params: Promise<{ id: string }> };

export default async function EditTipPage({ params }: Props) {
  const { id } = await params;
  const prediction = await getPredictionForAdmin(id);
  if (!prediction) notFound();

  const updateTipWithId = updateTip.bind(null, id);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <AdminHeader
        eyebrow="Tips"
        title={`Edit · ${prediction.fixture.homeTeam.name} v ${prediction.fixture.awayTeam.name}`}
      />

      <form action={updateTipWithId} className="flex flex-col gap-4">
        <label className={adminLabel}>
          <span className={adminLabelText}>Market</span>
          <select name="market" defaultValue={prediction.market} className={adminInput}>
            {Object.values(PredictionMarket).map((m) => (
              <option key={m} value={m}>
                {formatMarketLabel(m)}
              </option>
            ))}
          </select>
        </label>

        <label className={adminLabel}>
          <span className={adminLabelText}>Selection</span>
          <input name="selection" defaultValue={prediction.selection} required className={adminInput} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={adminLabel}>
            <span className={adminLabelText}>Odds</span>
            <input
              name="odds"
              type="number"
              step="0.01"
              min="1"
              defaultValue={prediction.odds.toString()}
              required
              className={adminInput}
            />
          </label>
          <label className={adminLabel}>
            <span className={adminLabelText}>Confidence (%)</span>
            <input
              name="confidence"
              type="number"
              min="0"
              max="100"
              defaultValue={prediction.confidence}
              required
              className={adminInput}
            />
          </label>
        </div>

        <label className={adminLabel}>
          <span className={adminLabelText}>Reasoning</span>
          <textarea
            name="reasoning"
            defaultValue={prediction.reasoning}
            required
            rows={4}
            className={adminInput}
          />
        </label>

        <label className={adminLabel}>
          <span className={adminLabelText}>Premium (paywall)</span>
          <select name="premium" defaultValue={prediction.premium} className={adminInput}>
            <option value="AUTO">Auto — premium if confidence ≥ {PREMIUM_CONFIDENCE_FLOOR}%</option>
            <option value="ALWAYS">Always premium</option>
            <option value="NEVER">Never premium (keep free)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isBanker" defaultChecked={prediction.isBanker} />
          Banker of the Day
        </label>

        <button type="submit" className={adminBtn}>
          Save changes
        </button>
      </form>
    </div>
  );
}
