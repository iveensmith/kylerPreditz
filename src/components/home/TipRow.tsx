import Link from "next/link";
import { SettledStatus } from "@/generated/prisma/enums";
import { formatMarketLabel } from "@/lib/format";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { FormBadges } from "@/components/ui/FormBadges";
import { MatchStatus } from "@/components/ui/MatchStatus";
import { matchSlug } from "@/lib/queries/match-detail";
import { PremiumCells } from "@/components/premium/PremiumCells";
import type { FixtureWithTipInfo } from "@/lib/queries/types";

const SETTLED_BADGE: Record<Exclude<SettledStatus, "PENDING">, string> = {
  WON: "bg-win/12 text-win",
  LOST: "bg-loss/12 text-loss",
  VOID: "bg-surface-2 text-muted",
};

/** A <tr> - must be rendered inside a <table><tbody>. */
export function TipRow({ fixture }: { fixture: FixtureWithTipInfo }) {
  const { prediction } = fixture;
  const href = `/predictions/${fixture.id}/${matchSlug(fixture.homeTeam.name, fixture.awayTeam.name)}`;

  return (
    <tr className="border-b border-line text-sm transition-colors last:border-b-0 hover:bg-surface-2">
      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs text-muted tabular-nums">
        <MatchStatus
          status={fixture.status}
          elapsedMinutes={fixture.elapsedMinutes}
          kickoffUtc={fixture.kickoffUtc}
          homeScore={fixture.homeScore}
          awayScore={fixture.awayScore}
        />
      </td>

      <td className="px-4 py-3.5 align-top">
        <Link href={href} className="group flex flex-col gap-1.5">
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

      {!prediction ? (
        <>
          <td className="px-4 py-3.5 align-top">
            <span className="text-xs italic text-faint">No tip</span>
          </td>
          <td className="px-4 py-3.5" />
          <td className="px-4 py-3.5" />
        </>
      ) : prediction.locked ? (
        <PremiumCells fixtureId={fixture.id} />
      ) : (
        <>
          <td className="px-4 py-3.5 align-top">
            <div className="flex flex-col gap-1">
              <span className="w-fit rounded border border-brand/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand">
                {formatMarketLabel(prediction.market)}
              </span>
              <span className="text-xs text-muted">{prediction.selection}</span>
            </div>
          </td>
          <td className="whitespace-nowrap px-4 py-3.5 align-top">
            <span className="font-mono text-sm tabular-nums text-ink">{prediction.odds.toString()}</span>
          </td>
          <td className="whitespace-nowrap px-4 py-3.5 text-right align-top">
            {prediction.settledAs === SettledStatus.PENDING ? (
              <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-white">
                {prediction.confidence}%
              </span>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${SETTLED_BADGE[prediction.settledAs]}`}
              >
                {prediction.settledAs}
              </span>
            )}
          </td>
        </>
      )}
    </tr>
  );
}
