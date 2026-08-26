import Image from "next/image";
import { TipRow } from "./TipRow";
import type { LeagueWithFixtures } from "@/lib/queries/types";

export function LeagueTipGroup({ league }: { league: LeagueWithFixtures }) {
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <header className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        {league.logoUrl && <Image src={league.logoUrl} alt={`${league.name} logo`} width={18} height={18} />}
        <h2 className="font-medium text-sm">{league.name}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{league.country}</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">{league.name} fixtures and predictions</caption>
          <thead>
            <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
              <th scope="col" className="px-3 py-2 font-medium">Kickoff</th>
              <th scope="col" className="px-3 py-2 font-medium">Match</th>
              <th scope="col" className="px-3 py-2 font-medium">Tip</th>
              <th scope="col" className="px-3 py-2 font-medium">Odds</th>
              <th scope="col" className="px-3 py-2 font-medium">Confidence</th>
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
