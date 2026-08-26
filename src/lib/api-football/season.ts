import type { SeasonCalendar } from "@/lib/leagues.config";

// API-Football labels a European-calendar season by its start year (e.g. the
// 2026-27 season is "2026"); those seasons turn over around July, ahead of
// the new campaign's preseason fixtures. Calendar-year leagues (Brazil, MLS,
// Argentina, Norway, Sweden - see leagues.config.ts) run within one calendar
// year instead, so they're just labeled by that year, with no July offset.
export function getCurrentSeason(now = new Date(), calendar: SeasonCalendar = "european"): number {
  if (calendar === "calendar-year") return now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  return month >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}
