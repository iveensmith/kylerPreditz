import type { PredictionMarket } from "@/generated/prisma/enums";

const MARKET_LABELS: Record<PredictionMarket, string> = {
  HOME_WIN: "Home Win",
  AWAY_WIN: "Away Win",
  DRAW: "Draw",
  DOUBLE_CHANCE_1X: "Double Chance 1X",
  DOUBLE_CHANCE_X2: "Double Chance X2",
  DOUBLE_CHANCE_12: "Double Chance 12",
  DRAW_NO_BET_HOME: "Draw No Bet (Home)",
  DRAW_NO_BET_AWAY: "Draw No Bet (Away)",
  OVER_1_5: "Over 1.5 Goals",
  UNDER_1_5: "Under 1.5 Goals",
  OVER_2_5: "Over 2.5 Goals",
  UNDER_2_5: "Under 2.5 Goals",
  OVER_3_5: "Over 3.5 Goals",
  UNDER_3_5: "Under 3.5 Goals",
  BTTS_YES: "Both Teams to Score",
  BTTS_NO: "Both Teams to Score - No",
  CORRECT_SCORE: "Correct Score",
  HT_OVER_0_5: "Over 0.5 Goals (HT)",
};

export function formatMarketLabel(market: PredictionMarket): string {
  return MARKET_LABELS[market];
}

const KICKOFF_TIME_ZONE = "Africa/Lagos";

export function formatKickoffTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: KICKOFF_TIME_ZONE }).format(date);
}

export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateParam(param: string | undefined): Date {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const parsed = new Date(`${param}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
}

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatDateStripLabel(date: Date, dayOffsetFromToday: number): string {
  if (dayOffsetFromToday === -1) return "Yesterday";
  if (dayOffsetFromToday === 0) return "Today";
  if (dayOffsetFromToday === 1) return "Tomorrow";
  return WEEKDAY_LABELS[date.getUTCDay()];
}

export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

export function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** Last 5 results (most recent last), e.g. "WWDLW" -> ["W","W","D","L","W"]. Empty/missing form returns []. */
export function formLetters(form: string | null | undefined): ("W" | "D" | "L")[] {
  if (!form) return [];
  return form
    .slice(-5)
    .split("")
    .filter((c): c is "W" | "D" | "L" => c === "W" || c === "D" || c === "L");
}
