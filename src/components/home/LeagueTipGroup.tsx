import Image from "next/image";
import { TipRow } from "./TipRow";
import type { LeagueWithFixtures } from "@/lib/queries/types";

export function LeagueTipGroup({ league }: { league: LeagueWithFixtures }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-line">
      <header className="flex items-center gap-2.5 border-b border-line bg-surface-2 px-4 py-2.5">
        {league.logoUrl && (
          <Image src={league.logoUrl} alt="" width={18} height={18} className="opacity-90" />
        )}
        <h2 className="text-[0.9375rem] font-semibold">{league.name}</h2>
        <span className="font-mono text-[10px] uppercase tracking-wide text-faint">{league.country}</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">{league.name} fixtures and predictions</caption>
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wide text-faint">
              <th scope="col" className="px-4 py-2 font-medium">Kickoff</th>
              <th scope="col" className="px-4 py-2 font-medium">Match</th>
              <th scope="col" className="px-4 py-2 font-medium">Tip</th>
              <th scope="col" className="px-4 py-2 font-medium">Odds</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {league.fixtures.map((fixture) => (
              <TipRow key={fixture.id} fixture={fixture} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
