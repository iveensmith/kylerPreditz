import { prisma } from "@/lib/db/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminSubscribersPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader title="Subscribers" />
      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted">
          No subscribers yet &mdash; this fills in once VIP checkout (Paystack, Phase 7) is live.
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
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs">{sub.user.email}</td>
                  <td className="px-3 py-2">{sub.plan}</td>
                  <td className="px-3 py-2 font-mono text-xs uppercase text-muted">{sub.status}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{sub.expiresAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
