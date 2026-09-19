import Link from "next/link";
import { getDashboardStats } from "@/lib/queries/admin";
import { getGamesToday } from "@/lib/site-settings";
import { RefreshSystemButton } from "@/components/admin/RefreshSystemButton";
import { GamesTodayToggle } from "@/components/admin/GamesTodayToggle";

export const dynamic = "force-dynamic";

function ago(d: Date | null): string {
  if (!d) return "never";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 48) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default async function AdminDashboardPage() {
  const [stats, gamesToday] = await Promise.all([getDashboardStats(), getGamesToday()]);
  const quotaPct = Math.round((stats.quotaUsed / stats.quotaLimit) * 100);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-line pb-4">
        <div className="eyebrow mb-1.5">Overview</div>
        <h1 className="text-[1.75rem] leading-none sm:text-3xl">Dashboard controls</h1>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Tips today" value={stats.todayTipCount} href="/admin/tips" />
        <Stat label="Total tips" value={stats.totalTips} href="/admin/tips" />
        <Stat label="Blog posts" value={stats.publishedPosts} sub={`${stats.draftPosts} draft${stats.draftPosts === 1 ? "" : "s"}`} href="/admin/blog" />
        <Stat label="Members" value={stats.members} href="/admin/members" />
        <Stat label="Subscribers" value={stats.activeSubscribers} href="/admin/subscribers" accent />
        <Stat label="Expired subscribers" value={stats.expiredSubscribers} href="/admin/subscribers" />
        <Stat label="Hit rate · 7d" value={stats.weekHitRate !== null ? `${stats.weekHitRate}%` : "—"} />
        <Stat label="Hit rate · 30d" value={stats.monthHitRate !== null ? `${stats.monthHitRate}%` : "—"} />
        <Stat label="API quota" value={`${stats.quotaUsed}/${stats.quotaLimit}`} sub={`${quotaPct}% used today`} />
        <Stat label="Premium tips" value={stats.premiumTips} sub="forced premium" href="/admin/tips" />
      </div>

      <section className="flex flex-col items-center gap-2 text-center">
        <div className="text-sm text-muted">{today}</div>
        <h2 className="mb-4 text-2xl sm:text-3xl">Welcome back</h2>
        <RefreshSystemButton />
        <p className="mt-2 max-w-md text-xs text-faint">
          Clears cached public pages so tip, post and league edits show immediately. Uses no API quota.
        </p>
      </section>

      <GamesTodayToggle initial={gamesToday} />

      <section className="rounded-[var(--radius-card)] border border-line bg-surface-2 px-5 py-4 text-sm">
        <div className="eyebrow mb-3">System status</div>
        <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          <div className="flex justify-between gap-4"><dt className="text-muted">Last fixture sync</dt><dd className="font-mono">{ago(stats.lastFixtureSync)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Last prediction run</dt><dd className="font-mono">{ago(stats.lastPredictionRun)}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function Stat({
  label, value, sub, href, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-4">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1.5 font-mono text-3xl font-semibold tabular-nums ${accent ? "text-brand" : ""}`}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-faint">{sub}</div>}
      {href && (
        <Link href={href} className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
          View / Manage
        </Link>
      )}
    </div>
  );
}
