// Recency weighting: how many matches back until a result counts half as much.
// "Around 8-10 matches" per spec.
export const HALF_LIFE_MATCHES = 9;

// Score matrix covers 0-8 goals for each side.
export const MAX_GOALS = 8;

// Dixon-Coles low-score dependence parameter. Negative values pull probability
// mass toward low-scoring draws/near-draws, correcting Poisson's independence
// assumption. -0.13 is the commonly cited fitted value from the original paper
// and widely reused as a fixed default absent league-specific fitting.
export const DIXON_COLES_RHO = -0.13;

// Half-time goals are modeled as this fraction of a team's full-match expected goals.
export const HALF_TIME_GOAL_SCALE = 0.45;

// A team needs at least this many prior matches (home + away combined) before
// its attack/defence strength is considered reliable.
export const MIN_MATCHES_REQUIRED = 6;

// Selection floor: minimum probability (0-1) a market must clear to be published.
export const DEFAULT_CONFIDENCE_FLOOR = 0.4;
