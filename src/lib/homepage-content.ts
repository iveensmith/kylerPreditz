import { SITE_NAME } from "./seo";

export type ContentSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

// Section structure and headings follow passionpredict.com's homepage copy.
// Two of their headings state a guarantee ("Sure Football Predictions Site",
// "How We Forcast Sure Win Predictions Today") and are renamed here - the
// content rules forbid "sure win" / guarantee language anywhere in the UI.
// All body copy is our own and describes our actual model.

export const HOMEPAGE_INTRO: string[] = [
  `${SITE_NAME} publishes free football predictions every day, each with a suggested betting market, fair odds, and a confidence rating, for matches across 30 leagues around the world. Every tip is the output of our own statistical model rather than a tipster's hunch, and the platform gives fans and bettors a clearer picture of how a match might go before kickoff.`,
  `The site is built to be quick to read and easy to check. Predictions are analysed with a consistent method and written plainly, so you can follow the reasoning, see how each call has performed, and enjoy the game with more context. ${SITE_NAME} also keeps a public results archive of every settled tip - wins and losses alike, never edited after the fact.`,
];

export const HOW_IT_WORKS: ContentSection[] = [
  {
    heading: "Accurate Football Predicting Site",
    body: [
      `${SITE_NAME} provides free football predictions and betting tips for today's and tomorrow's matches, along with match analysis, team statistics, form guides and league tables. Coverage spans leagues and cups worldwide, from the biggest European divisions to selected competitions in the Americas, Asia and elsewhere.`,
      `The site was built to keep football predictions simple. Many prediction sites overcomplicate things or make promises they cannot keep. ${SITE_NAME} is straightforward to navigate on a phone or a desktop, every tip is analysed with the same method, and the confidence figure next to each pick tells you exactly how strongly the model rates it.`,
    ],
  },
  {
    heading: "Our Services",
    body: [
      `${SITE_NAME} publishes free football predictions from popular leagues, each with its own results history and statistics. We cover the common betting markets: Full Time Result (1X2), Double Chance, Draw No Bet, straight win predictions, Over/Under goals at 1.5, 2.5 and 3.5, Both Teams To Score (GG/BTTS), correct score and first-half goals.`,
      `For a free daily selection you can also join our Telegram channel. Whatever you stake, bet small, stay disciplined, and enjoy the game.`,
    ],
  },
  {
    heading: "All Soccer Predictions For Today and Tomorrow",
    body: [
      `We cover 30 competitions, including the English Premier League and Championship, Spanish La Liga and Segunda Division, Italian Serie A and Serie B, German Bundesliga and 2. Bundesliga, French Ligue 1 and Ligue 2, the Dutch Eredivisie, Portuguese Primeira Liga, Belgian Pro League, Scottish Premiership, Turkish Super Lig, Saudi Pro League, Japan's J1 League, the Australian A-League, MLS, Brazil's Serie A and Serie B, the Argentine Primera Division, Norway's Eliteserien, Sweden's Allsvenskan and Liga MX.`,
      `That range means you can choose fixtures from several leagues and betting markets each day rather than being limited to one or two.`,
    ],
  },
  {
    heading: "Mathematical Football Prediction",
    body: [
      `Football has a lot of maths in it, and ${SITE_NAME} uses a statistical method for every prediction. For each team we measure how many goals they score and concede relative to their league, split by home and away form, and weighted so that recent matches count for more than older ones.`,
      `That produces an expected-goals figure for each side, which becomes a full grid of likely scorelines through a Poisson model with a Dixon-Coles adjustment for tight, low-scoring games. Every market on the fixture - the result, the goals lines, both teams to score - is read straight off that one grid, so the numbers never contradict each other.`,
    ],
  },
  {
    heading: "How We Forecast Predictions",
    body: [
      `${SITE_NAME} is free and open to anyone. Each day the model runs over upcoming fixtures and evaluates:`,
    ],
    bullets: [
      "Recent form, home and away",
      "Head-to-head history between the two teams",
      "Goals scored and conceded per game",
      "Clean sheets and games without scoring",
      "League position and rest days",
      "Known injuries and suspensions, where available",
    ],
  },
  {
    heading: "How Accurate Our Predictions Are",
    body: [
      `We work at making the predictions as accurate as the data reasonably allows by focusing on how teams are actually performing, who they are facing, and their recent record. The method is identical for every match, so nothing is cherry-picked after the result is known.`,
      `The honest position: no prediction site can promise profit. Sports betting carries risk and even a strong call loses sometimes. What ${SITE_NAME} offers is a consistent method and a full, unedited record of how it has done - which is more than most sites will show you. A sensible habit is to stick to single bets on selections with a solid probability rather than stacking every tip onto one slip.`,
    ],
  },
  {
    heading: "Best Football Prediction Site In The World",
    body: [
      `${SITE_NAME} aims to be among the most reliable football prediction sites available, with free daily predictions, betting tips and a confidence rating on every pick. We would rather publish a smaller number of well-analysed selections than a long list of weak ones.`,
      `Football is followed the world over, and only a handful of sites put out consistent, methodical predictions. Our goal is to be one of them: the same method every day, every result kept on the record, and no claims we cannot back up.`,
    ],
  },
  {
    heading: "Site That Predicts Football Matches Correctly",
    body: [
      `${SITE_NAME} is built to call football matches as accurately as the data allows, for today's fixtures and tomorrow's. Whether it is a result, a goals line or both teams to score, each prediction is derived from the model's read of the two teams and the price on offer.`,
      `No prediction is guaranteed - football always carries some uncertainty. We use straightforward statistical analysis of head-to-head record, recent form, home and away performance and injuries. Our Telegram channel also carries a free lower-risk selection each day.`,
    ],
  },
  {
    heading: "100% Free Football Predictions",
    body: [
      `Every prediction on the main site is free. ${SITE_NAME} publishes free football tips, analysis, form guides, statistics, latest results and league tables, with only the Premium section reserved for subscribers who want the model's highest-rated picks.`,
      `We also publish match statistics and tables for the leagues we cover. Free tip categories include Banker of the Day, home win and away win predictions, BTTS/GG, Double Chance, HT Over 0.5, Over 1.5, Over 2.5, Under 3.5, Draw predictions, Draw No Bet, single bets and Win Either Half.`,
    ],
  },
  {
    heading: "Top 10 Football Prediction Site 2026",
    body: [
      `A few things we try to get right, and that we think a good prediction site should:`,
    ],
    bullets: [
      "Free predictions with no hidden charges on the main site",
      "Coverage across the major leagues - the Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and more",
      "One consistent method applied to every fixture, not a different story each day",
      "Free access to the daily predictions without signing up",
      "A public results archive where losing tips are never removed or edited",
      "Predictions published early each day, so you have time to check them",
    ],
  },
  {
    heading: "Summary",
    body: [
      `${SITE_NAME} publishes free, statistically-modelled football predictions every day, each with a clear confidence rating and a full public record. The aim is simple: give football fans and bettors a better-informed picture of a match before kickoff, and be honest that no tip is a certainty. Browse the free predictions above, and check the results archive to see how the model has actually performed.`,
    ],
  },
];
