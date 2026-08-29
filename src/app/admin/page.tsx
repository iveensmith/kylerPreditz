import { getDashboardStats } from "@/lib/queries/admin";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const quotaPct = Math.round((stats.quotaUsed / stats.quotaLimit) * 100);

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <div className="eyebrow mb-1.5">Overview</div>
        <h1 className="text-[1.75rem] leading-none sm:text-3xl">Dashboard</h1>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4">
        <Stat label="Today's tips" value={stats.todayTipCount.toString()} />
        <Stat label="Hit rate · 7d" value={stats.weekHitRate !== null ? `${stats.weekHitRate}%` : "—"} />
        <Stat label="Hit rate · 30d" value={stats.monthHitRate !== null ? `${stats.monthHitRate}%` : "—"} />
        <Stat label="API quota" value={`${stats.quotaUsed}/${stats.quotaLimit}`} sub={`${quotaPct}% used today`} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface px-4 py-4">
      <div className="font-mono text-2xl font-semibold tabular-nums">{value}</div>
      <div className="eyebrow mt-1.5">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}
