export type SeasonCalendar = "european" | "calendar-year";

type TrackedLeague = {
  apiId: number;
  name: string;
  country: string;
  slug: string;
  priority: number;
  /** Leagues whose season doesn't follow the Aug-May European cycle. Defaults to "european". */
  calendarType?: SeasonCalendar;
};

// apiId values are API-Football's stable league IDs, confirmed via a live
// /leagues?search= lookup against the real API (never hand-typed from memory -
// a wrong id here silently syncs the wrong competition). Seeding works from
// this hardcoded metadata with zero API calls; sync jobs use apiId to pull
// fixtures/teams/stats.
export const TRACKED_LEAGUES: TrackedLeague[] = [
  // Launch tier - the "big 5".
  { apiId: 39, name: "Premier League", country: "England", slug: "premier-league", priority: 1 },
  { apiId: 140, name: "La Liga", country: "Spain", slug: "la-liga", priority: 2 },
  { apiId: 135, name: "Serie A", country: "Italy", slug: "serie-a", priority: 3 },
  { apiId: 78, name: "Bundesliga", country: "Germany", slug: "bundesliga", priority: 4 },
  { apiId: 61, name: "Ligue 1", country: "France", slug: "ligue-1", priority: 5 },

  // Big-5 second divisions.
  { apiId: 40, name: "Championship", country: "England", slug: "championship", priority: 6 },
  { apiId: 141, name: "Segunda División", country: "Spain", slug: "segunda-division", priority: 7 },
  { apiId: 136, name: "Serie B", country: "Italy", slug: "serie-b-italy", priority: 8 },
  { apiId: 79, name: "2. Bundesliga", country: "Germany", slug: "2-bundesliga", priority: 9 },
  { apiId: 62, name: "Ligue 2", country: "France", slug: "ligue-2", priority: 10 },

  // Other strong European top flights + a couple of well-covered second tiers.
  { apiId: 88, name: "Eredivisie", country: "Netherlands", slug: "eredivisie", priority: 11 },
  { apiId: 94, name: "Primeira Liga", country: "Portugal", slug: "primeira-liga", priority: 12 },
  { apiId: 95, name: "Segunda Liga", country: "Portugal", slug: "segunda-liga", priority: 13 },
  { apiId: 144, name: "Jupiler Pro League", country: "Belgium", slug: "jupiler-pro-league", priority: 14 },
  { apiId: 179, name: "Premiership", country: "Scotland", slug: "scottish-premiership", priority: 15 },
  { apiId: 203, name: "Süper Lig", country: "Turkey", slug: "super-lig", priority: 16 },
  { apiId: 218, name: "Bundesliga", country: "Austria", slug: "austrian-bundesliga", priority: 17 },
  { apiId: 207, name: "Super League", country: "Switzerland", slug: "swiss-super-league", priority: 18 },
  { apiId: 197, name: "Super League 1", country: "Greece", slug: "greek-super-league", priority: 19 },
  { apiId: 119, name: "Superliga", country: "Denmark", slug: "danish-superliga", priority: 20 },
  { apiId: 307, name: "Pro League", country: "Saudi-Arabia", slug: "saudi-pro-league", priority: 21 },
  { apiId: 98, name: "J1 League", country: "Japan", slug: "j1-league", priority: 22 },
  { apiId: 188, name: "A-League", country: "Australia", slug: "a-league", priority: 23 },

  // Calendar-year seasons (Jan/Feb-Nov/Dec) - see calendarType below.
  {
    apiId: 71,
    name: "Serie A",
    country: "Brazil",
    slug: "brasileirao-serie-a",
    priority: 24,
    calendarType: "calendar-year",
  },
  {
    apiId: 72,
    name: "Serie B",
    country: "Brazil",
    slug: "brasileirao-serie-b",
    priority: 25,
    calendarType: "calendar-year",
  },
  {
    apiId: 128,
    name: "Liga Profesional Argentina",
    country: "Argentina",
    slug: "liga-profesional-argentina",
    priority: 26,
    calendarType: "calendar-year",
  },
  {
    apiId: 253,
    name: "Major League Soccer",
    country: "USA",
    slug: "mls",
    priority: 27,
    calendarType: "calendar-year",
  },
  {
    apiId: 103,
    name: "Eliteserien",
    country: "Norway",
    slug: "eliteserien",
    priority: 28,
    calendarType: "calendar-year",
  },
  {
    apiId: 113,
    name: "Allsvenskan",
    country: "Sweden",
    slug: "allsvenskan",
    priority: 29,
    calendarType: "calendar-year",
  },

  // Split-season league (Apertura/Clausura) - tracked on the default European
  // calendar for now. Not fully correct (each half-season resets mid-cycle),
  // flagged here as a known gap rather than modeled properly.
  { apiId: 262, name: "Liga MX", country: "Mexico", slug: "liga-mx", priority: 30 },
];

const CALENDAR_TYPE_BY_API_ID = new Map<number, SeasonCalendar>(
  TRACKED_LEAGUES.filter((l) => l.calendarType).map((l) => [l.apiId, l.calendarType!]),
);

/** How to resolve "current season" for this league - see getCurrentSeason(). */
export function seasonCalendarForApiId(apiId: number): SeasonCalendar {
  return CALENDAR_TYPE_BY_API_ID.get(apiId) ?? "european";
}

export function seasonCalendarForSlug(slug: string): SeasonCalendar {
  const league = TRACKED_LEAGUES.find((l) => l.slug === slug);
  return league ? seasonCalendarForApiId(league.apiId) : "european";
}

export function apiLeagueLogoUrl(apiId: number): string {
  return `https://media.api-sports.io/football/leagues/${apiId}.png`;
}

export function apiTeamLogoUrl(apiId: number): string {
  return `https://media.api-sports.io/football/teams/${apiId}.png`;
}
