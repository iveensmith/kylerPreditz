import { prisma } from "@/lib/db/prisma";

export default async function AdminSubscribersPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Subscribers</h1>
      {subscriptions.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No subscribers yet - this fills in once VIP checkout (Paystack, Phase 7) is live.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs">
              <tr>
                <th className="text-left font-medium px-3 py-2">Email</th>
                <th className="text-left font-medium px-3 py-2">Plan</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-left font-medium px-3 py-2">Expires</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{sub.user.email}</td>
                  <td className="px-3 py-2">{sub.plan}</td>
                  <td className="px-3 py-2">{sub.status}</td>
                  <td className="px-3 py-2">{sub.expiresAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
