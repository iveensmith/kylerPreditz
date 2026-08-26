"use client";

import { useState } from "react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import type { StandingsByLeague } from "@/lib/queries/homepage";

export function LeagueTablesTabs({ leagues }: { leagues: StandingsByLeague }) {
  const [activeSlug, setActiveSlug] = useState(leagues[0]?.slug);
  const active = leagues.find((l) => l.slug === activeSlug) ?? leagues[0];
  if (!active) return null;

  return (
    <section>
      <h2 className="font-semibold mb-3">League Tables</h2>
      <div className="flex gap-1 mb-3 overflow-x-auto" role="tablist">
        {leagues.map((league) => (
          <button
            key={league.slug}
            role="tab"
            aria-selected={league.slug === active.slug}
            onClick={() => setActiveSlug(league.slug)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              league.slug === active.slug
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {league.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs">
            <tr>
              <th className="text-left font-medium px-3 py-2">#</th>
              <th className="text-left font-medium px-3 py-2">Team</th>
              <th className="text-right font-medium px-3 py-2">P</th>
              <th className="text-right font-medium px-3 py-2">GD</th>
              <th className="text-right font-medium px-3 py-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            {active.standings.map((row) => (
              <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 tabular-nums text-zinc-500 dark:text-zinc-400">{row.rank}</td>
                <td className="px-3 py-2">
                  <TeamBadge name={row.team.name} logoUrl={row.team.logoUrl} size={16} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{row.played}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
