import { formatMarketLabel } from "@/lib/format";
// note: keep phrasing clear of banned superlatives (see content-rules.ts)
import type { MatchDetail } from "@/lib/queries/match-detail";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formCounts(form: string): { w: number; d: number; l: number } {
  return {
    w: (form.match(/W/g) || []).length,
    d: (form.match(/D/g) || []).length,
    l: (form.match(/L/g) || []).length,
  };
}

function describeForm(name: string, form: string): string {
  if (!form) return `${name} arrive without a tracked recent run to lean on.`;
  const { w, d, l } = formCounts(form);
  const parts: string[] = [];
  if (w) parts.push(`${w} win${w > 1 ? "s" : ""}`);
  if (d) parts.push(`${d} draw${d > 1 ? "s" : ""}`);
  if (l) parts.push(`${l} defeat${l > 1 ? "s" : ""}`);
  const joined = parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts.slice(-1) : parts[0];
  const games = form.length === 1 ? "game" : "games";
  return `Over their last ${form.length} league ${games} ${name} have taken ${joined} (${form.split("").join(" ")}).`;
}

/** Builds a data-driven multi-paragraph write-up for a match-detail page. Pure. */
export function buildMatchAnalysis(detail: MatchDetail): string[] {
  const { fixture, homeStats, awayStats, h2hFixtures } = detail;
  const { homeTeam, awayTeam, league, prediction, venue } = fixture;
  const home = homeTeam.name;
  const away = awayTeam.name;

  const paras: string[] = [];

  // 1. Setting
  {
    const kickoff = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(fixture.kickoffUtc);
    let p = `${home} host ${away} in the ${league.name}, kicking off on ${kickoff}`;
    p += venue ? ` at ${venue}. ` : ". ";
    if (homeStats.leaguePosition && awayStats.leaguePosition) {
      p += `${home} sit ${ordinal(homeStats.leaguePosition)} in the table and ${away} are ${ordinal(
        awayStats.leaguePosition,
      )}, `;
      p +=
        homeStats.leaguePosition < awayStats.leaguePosition
          ? `so the hosts start as the higher-ranked side.`
          : homeStats.leaguePosition > awayStats.leaguePosition
            ? `so the visitors come in above their hosts.`
            : `leaving little between them on points.`;
    }
    paras.push(p);
  }

  // 2. Home form + scoring
  paras.push(
    `${describeForm(home, homeStats.form)} At home and away combined they are averaging ${homeStats.goalsForAvg.toFixed(1)} goals scored and ${homeStats.goalsAgainstAvg.toFixed(1)} conceded per game this season, with ${homeStats.cleanSheets} clean sheet${homeStats.cleanSheets === 1 ? "" : "s"} on the board.`,
  );

  // 3. Away form + scoring
  paras.push(
    `${describeForm(away, awayStats.form)} ${away} are averaging ${awayStats.goalsForAvg.toFixed(1)} scored and ${awayStats.goalsAgainstAvg.toFixed(1)} conceded per game, keeping ${awayStats.cleanSheets} clean sheet${awayStats.cleanSheets === 1 ? "" : "s"} so far.`,
  );

  // 4. Head to head
  if (h2hFixtures.length > 0) {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let goals = 0;
    for (const f of h2hFixtures) {
      goals += f.home.goals + f.away.goals;
      const homeSideIsHomeTeam = f.home.name === home;
      const winnerHome = f.home.goals > f.away.goals;
      const winnerAway = f.away.goals > f.home.goals;
      if (f.home.goals === f.away.goals) draws++;
      else if ((winnerHome && homeSideIsHomeTeam) || (winnerAway && !homeSideIsHomeTeam)) homeWins++;
      else awayWins++;
    }
    const avg = (goals / h2hFixtures.length).toFixed(1);
    paras.push(
      `Their last ${h2hFixtures.length} meetings have produced ${homeWins} win${homeWins === 1 ? "" : "s"} for ${home}, ${awayWins} for ${away} and ${draws} draw${draws === 1 ? "" : "s"}, averaging ${avg} goals a game. That recent history is one of the inputs behind the rating below.`,
    );
  }

  // 5. The pick
  if (prediction && !prediction.locked) {
    const eg =
      prediction.expectedGoalsHome != null && prediction.expectedGoalsAway != null
        ? ` The model's expected-goals line for this fixture is ${prediction.expectedGoalsHome.toFixed(2)} to ${prediction.expectedGoalsAway.toFixed(2)}.`
        : "";
    paras.push(
      `Weighing recent scoring rates, home and away splits and the head-to-head record through a Poisson model with a Dixon-Coles low-score adjustment, our engine lands on ${formatMarketLabel(prediction.market)} (${prediction.selection}) as the pick, rated ${prediction.confidence}% at odds of ${prediction.odds.toString()}.${eg}`,
    );
    if (prediction.reasoning) paras.push(prediction.reasoning);
  } else if (prediction?.locked) {
    paras.push(
      `Our engine rates this fixture highly enough that the pick, confidence and full market grid are held for Premium members. The form, head-to-head and table data above are the same numbers that rating is built from.`,
    );
  }

  return paras;
}
