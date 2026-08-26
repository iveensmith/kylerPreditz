import Link from "next/link";
import { SettledStatus } from "@/generated/prisma/enums";
import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { FormBadges } from "@/components/ui/FormBadges";
import { MatchStatus } from "@/components/ui/MatchStatus";
import { matchSlug } from "@/lib/queries/match-detail";
import type { FixtureWithTipInfo } from "@/lib/queries/types";

const SETTLED_BADGE: Record<Exclude<SettledStatus, "PENDING">, string> = {
  WON: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  VOID: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

/** A <tr> - must be rendered inside a <table><tbody>. */
export function TipRow({ fixture }: { fixture: FixtureWithTipInfo }) {
  const { prediction } = fixture;
  const href = `/predictions/${fixture.id}/${matchSlug(fixture.homeTeam.name, fixture.awayTeam.name)}`;

  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800 text-sm hover:bg-brand/5 dark:hover:bg-brand/10 transition-colors">
      <td className="px-3 py-3 whitespace-nowrap tabular-nums text-zinc-500 dark:text-zinc-400 align-top">
        <MatchStatus
          status={fixture.status}
          elapsedMinutes={fixture.elapsedMinutes}
          kickoffUtc={fixture.kickoffUtc}
          homeScore={fixture.homeScore}
          awayScore={fixture.awayScore}
        />
      </td>

      <td className="px-3 py-3 align-top">
        <Link href={href} className="flex flex-col gap-1.5 group">
          <div className="flex items-center gap-2">
            <TeamBadge name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} />
            <FormBadges form={fixture.homeTeam.stats[0]?.form} />
          </div>
          <div className="flex items-center gap-2">
            <TeamBadge name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} />
            <FormBadges form={fixture.awayTeam.stats[0]?.form} />
          </div>
          <span className="sr-only">View match details</span>
        </Link>
      </td>

      <td className="px-3 py-3 align-top whitespace-nowrap">
        {prediction ? (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center rounded-full border border-brand/40 dark:border-brand/50 text-brand-hover dark:text-brand-light px-2 py-0.5 text-xs font-semibold">
              TIP: {formatMarketLabel(prediction.market)}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{prediction.selection}</span>
          </div>
        ) : (
          <span className="text-zinc-400 text-xs italic">No tip</span>
        )}
      </td>

      <td className="px-3 py-3 align-top whitespace-nowrap">
        {prediction && (
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 text-xs font-medium tabular-nums">
            Odds: {prediction.odds.toString()}
          </span>
        )}
      </td>

      <td className="px-3 py-3 align-top whitespace-nowrap">
        {prediction &&
          (prediction.settledAs === SettledStatus.PENDING ? (
            <span className="inline-flex items-center rounded-full bg-brand text-white px-2.5 py-1 text-xs font-semibold tabular-nums shadow-sm">
              {prediction.confidence}%
            </span>
          ) : (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${SETTLED_BADGE[prediction.settledAs]}`}
            >
              {prediction.settledAs}
            </span>
          ))}
      </td>
    </tr>
  );
}
