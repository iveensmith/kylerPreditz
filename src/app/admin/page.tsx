import { getDashboardStats } from "@/lib/queries/admin";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const quotaPct = Math.round((stats.quotaUsed / stats.quotaLimit) * 100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Today's Tips" value={stats.todayTipCount.toString()} />
        <StatCard label="Hit Rate (7d)" value={stats.weekHitRate !== null ? `${stats.weekHitRate}%` : "-"} />
        <StatCard label="Hit Rate (30d)" value={stats.monthHitRate !== null ? `${stats.monthHitRate}%` : "-"} />
        <StatCard label="API Quota" value={`${stats.quotaUsed} / ${stats.quotaLimit}`} sub={`${quotaPct}% used today`} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
    </div>
  );
}
