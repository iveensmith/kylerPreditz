"use client";

import { useState } from "react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { StandingsByLeague } from "@/lib/queries/homepage";

export function LeagueTablesTabs({ leagues }: { leagues: StandingsByLeague }) {
  const [activeSlug, setActiveSlug] = useState(leagues[0]?.slug);
  const active = leagues.find((l) => l.slug === activeSlug) ?? leagues[0];
  if (!active) return null;

  return (
    <section>
      <SectionHeading eyebrow="Standings" title="League tables" />
      <div className="mb-3 flex gap-1.5 overflow-x-auto" role="tablist">
        {leagues.map((league) => (
          <button
            key={league.slug}
            role="tab"
            aria-selected={league.slug === active.slug}
            onClick={() => setActiveSlug(league.slug)}
            className={`shrink-0 rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-medium transition-colors ${
              league.slug === active.slug
                ? "bg-brand text-white"
                : "border border-line text-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {league.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Team</th>
              <th className="px-3 py-2 text-right font-medium">P</th>
              <th className="px-3 py-2 text-right font-medium">GD</th>
              <th className="px-3 py-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {active.standings.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-muted tabular-nums">{row.rank}</td>
                <td className="px-3 py-2">
                  <TeamBadge name={row.team.name} logoUrl={row.team.logoUrl} size={16} />
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.played}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
