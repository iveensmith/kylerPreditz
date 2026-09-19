import { getPaymentsForAdmin } from "@/lib/queries/admin";
import { getPlanList } from "@/lib/plans.server";
import { formatNaira } from "@/lib/plans.config";
import { parsePageParam } from "@/lib/pagination";
import { absoluteUrl } from "@/lib/seo";
import { adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";
import { updatePlanPrices } from "@/lib/actions/payments";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/ui/Pagination";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string }> };

const naira = (kobo: number) => formatNaira(Math.round(kobo / 100));

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`mt-0.5 font-mono text-xs font-bold ${ok ? "text-win" : "text-loss"}`}>{ok ? "OK" : "NO"}</span>
      <span>{label}</span>
    </li>
  );
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const page = parsePageParam((await searchParams).page);
  const [pay, plans] = await Promise.all([getPaymentsForAdmin(page), getPlanList()]);

  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY ?? "";
  const mode = secret.startsWith("sk_live_") ? "LIVE" : secret.startsWith("sk_test_") ? "TEST" : null;
  const webhookUrl = absoluteUrl("/api/paystack/webhook");
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <AdminHeader eyebrow="Billing" title="Payments" />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4">
        {[
          ["Payments", pay.totalPayments.toLocaleString("en-US")],
          ["Revenue (recorded)", naira(pay.revenueKobo)],
          ["Last 30 days", naira(pay.revenue30dKobo)],
          ["Mode", mode ?? "Not set"],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface px-4 py-4">
            <div className="eyebrow">{label}</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </div>
      {pay.recordedCount < pay.totalPayments && (
        <p className="-mt-4 text-xs text-faint">
          Revenue only counts payments whose amount was recorded ({pay.recordedCount} of {pay.totalPayments}); older
          payments predate amount tracking.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line p-4">
          <h2 className="text-sm font-semibold">Paystack setup</h2>
          <ul className="flex flex-col gap-2.5">
            <Check ok={secret.length > 0} label={mode ? `Secret key set (${mode} mode)` : "Secret key not set"} />
            <Check ok={publicKey.length > 0} label={publicKey ? "Public key set" : "Public key not set"} />
          </ul>
          <div className="text-xs text-muted">
            Webhook URL to paste in your Paystack dashboard (Settings, API Keys &amp; Webhooks):
            <code className="mt-1 block break-all rounded bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-ink">
              {webhookUrl}
            </code>
          </div>
        </section>

        <ActionForm
          action={updatePlanPrices}
          submitLabel="Save prices"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line p-4"
        >
          <h2 className="text-sm font-semibold">Plan prices (naira)</h2>
          {plans.map((p) => (
            <label key={p.plan} className={adminLabel}>
              <span className={adminLabelText}>{p.label}</span>
              <input name={p.plan} inputMode="numeric" defaultValue={p.priceNaira} required className={adminInput} />
            </label>
          ))}
          <p className="text-xs text-muted">Whole naira. Applies to new checkouts; existing subscribers are unaffected.</p>
        </ActionForm>
      </div>

      {pay.items.length === 0 ? (
        <p className="text-sm text-muted">No Paystack payments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Plan</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {pay.items.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono tabular-nums">{s.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.user.email}</td>
                  <td className="px-3 py-2">{s.plan}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {s.amountKobo != null ? naira(s.amountKobo) : <span className="text-faint">-</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs uppercase text-muted">
                    {s.status === "ACTIVE" && s.expiresAt < now ? "EXPIRED" : s.status}
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 font-mono text-[11px] text-faint" title={s.paystackRef}>
                    {s.paystackRef}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={pay.meta} basePath="/admin/payments" />
    </div>
  );
}
