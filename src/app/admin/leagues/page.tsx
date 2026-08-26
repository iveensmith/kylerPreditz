import { prisma } from "@/lib/db/prisma";
import { toggleLeagueFeatured } from "@/lib/actions/leagues";

export default async function AdminLeaguesPage() {
  const leagues = await prisma.league.findMany({ orderBy: { priority: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">League Manager</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Only featured leagues are synced by the fixtures/stats/predictions jobs - toggle a league off to stop pulling
        it and save API quota.
      </p>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 text-sm"
          >
            <div>
              <div className="font-medium">{league.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{league.country}</div>
            </div>
            <form action={toggleLeagueFeatured.bind(null, league.id, !league.isFeatured)}>
              <button
                type="submit"
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  league.isFeatured
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {league.isFeatured ? "Featured - click to disable" : "Disabled - click to feature"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
