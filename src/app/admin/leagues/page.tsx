import { prisma } from "@/lib/db/prisma";
import { toggleLeagueFeatured } from "@/lib/actions/leagues";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLeaguesPage() {
  const leagues = await prisma.league.findMany({ orderBy: { priority: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader title="League manager" />
      <p className="max-w-2xl text-sm text-muted">
        Only featured leagues are synced by the fixtures / stats / predictions jobs &mdash; toggle a
        league off to stop pulling it and save API quota.
      </p>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0"
          >
            <div>
              <div className="font-medium">{league.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-faint">{league.country}</div>
            </div>
            <form action={toggleLeagueFeatured.bind(null, league.id, !league.isFeatured)}>
              <button
                type="submit"
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  league.isFeatured ? "bg-win/12 text-win hover:bg-win/20" : "bg-surface-2 text-muted hover:bg-line"
                }`}
              >
                {league.isFeatured ? "Featured" : "Off"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
