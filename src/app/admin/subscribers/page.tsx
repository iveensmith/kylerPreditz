import { SubscriptionStatus } from "@/generated/prisma/enums";
import { getSubscribersForAdmin } from "@/lib/queries/admin";
import { parsePageParam } from "@/lib/pagination";
import { adminBtn, adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";
import { grantTestSubscription, revokeSubscription } from "@/lib/actions/subscriptions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/ui/Pagination";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminSubscribersPage({ searchParams }: Props) {
  const page = parsePageParam((await searchParams).page);
  const { items: subscriptions, meta } = await getSubscribersForAdmin(page);

  return (
    <div className="flex flex-col gap-8">
      <AdminHeader title="Subscribers" />

      <section className="flex max-w-lg flex-col gap-3 rounded-[var(--radius-card)] border border-line p-4">
        <div>
          <h2 className="text-sm font-semibold">Grant a test subscription</h2>
          <p className="mt-1 text-xs text-muted">
            Stand-in until Paystack checkout is live. The user account must already exist.
          </p>
        </div>
        <form action={grantTestSubscription} className="flex flex-col gap-3">
          <label className={adminLabel}>
            <span className={adminLabelText}>User email</span>
            <input name="email" type="email" required placeholder="member@example.com" className={adminInput} />
          </label>
          <label className={adminLabel}>
            <span className={adminLabelText}>Plan</span>
            <select name="plan" required defaultValue="WEEKLY" className={adminInput}>
              <option value="WEEKLY">Weekly (7 days)</option>
              <option value="MONTHLY">Monthly (30 days)</option>
              <option value="LIFETIME">Lifetime</option>
            </select>
          </label>
          <button type="submit" className={adminBtn}>
            Grant subscription
          </button>
        </form>
      </section>

      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted">
          {meta.total === 0 ? "No subscribers yet." : "No subscribers on this page."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Plan</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Expires</th>
                <th className="px-3 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs">{sub.user.email}</td>
                  <td className="px-3 py-2">{sub.plan}</td>
                  <td className="px-3 py-2 font-mono text-xs uppercase text-muted">{sub.status}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{sub.expiresAt.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2 text-right">
                    {sub.status === SubscriptionStatus.ACTIVE ? (
                      <form action={revokeSubscription}>
                        <input type="hidden" name="id" value={sub.id} />
                        <button type="submit" className="font-mono text-[11px] uppercase tracking-wide text-loss hover:underline">
                          Revoke
                        </button>
                      </form>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={meta} basePath="/admin/subscribers" />
    </div>
  );
}
