import type { MarketPageConfig } from "./markets.config";
import { SITE_NAME } from "./seo";
import type { FaqEntry } from "./structured-data";

// Question set mirrors passionpredict.com's homepage FAQ; answers are written for
// our own model and kept within the content rules (no "sure win" / guarantees,
// no invented accuracy figures or company details).
export const HOMEPAGE_FAQ: FaqEntry[] = [
  {
    question: `What is ${SITE_NAME} Website?`,
    answer:
      `${SITE_NAME} is a football prediction and statistics site for fans and bettors who want a clearer read on a match before kickoff. Every day we publish free predictions - each with a suggested betting market, fair odds and a confidence rating - right next to the detail behind them: recent form, head-to-head records, league tables, and a results archive that keeps every past tip on show, win or loss. It's built to be quick to check on your phone and easy to follow. Got a question? Reach us on WhatsApp or Telegram - links are in the footer.`,
  },
  {
    question: `Are ${SITE_NAME} Tips Really Free?`,
    answer:
      "Yes. Every prediction on the main site is free, with no sign-up required and no hidden charges. The only paid part is the Premium section, which holds the model's highest-rated picks for subscribers. Today's and tomorrow's tips, the analysis, the statistics and the full results archive are all open to everyone.",
  },
  {
    question: "Where do We Get Our Tips?",
    answer:
      "Every tip comes from our own statistical model. It reads each team's recent scoring and conceding rates, split by home and away form and weighted toward recent games, then builds a grid of likely scorelines using a Poisson model with a Dixon-Coles adjustment. Every market is derived from that one grid. There is no tipster picking favourites by feel, though an admin can override a pick and it is flagged when that happens.",
  },
  {
    question: "How Accurate Are Our Tips?",
    answer:
      "It varies by match and by market, and we don't publish a single headline accuracy figure because one number is easy to massage. Instead the whole record is public: the results archive shows every settled prediction, win or loss, with nothing removed or edited. The confidence percentage next to each tip is the model's own probability estimate, capped at 92% - and a 92% pick still loses roughly one time in twelve.",
  },
  {
    question: `How Can I Win Bet Using ${SITE_NAME} Tips?`,
    answer:
      "There is no way to guarantee a winning bet, and anyone who tells you otherwise is not being straight with you. What helps: favour selections with a strong probability, prefer single bets to large accumulators, stake only what you can afford to lose, and read the reasoning and head-to-head data on the match page before you commit. Treat the tips as one input, not a certainty.",
  },
  {
    question: "When Do We Post Our Tips?",
    answer:
      "Predictions for the next couple of days are generated in the early morning and refresh through the day as team news and results come in. Fixtures and scores sync automatically so the board stays current. Late injury news is exactly when a pick is most likely to change.",
  },
  {
    question: `What is ${SITE_NAME} Official Telegram Channel?`,
    answer:
      "Our Telegram channel carries a free daily selection plus updates. The link is in the site footer and on the VIP page - join from there rather than trusting any channel that copies our name.",
  },
  {
    question: `Is ${SITE_NAME} Legit and Safe?`,
    answer:
      `Yes. ${SITE_NAME} is a straightforward predictions site: it does not take bets, hold funds, or ask for payment to see the free tips. Predictions are never edited after results are published - the archive is permanent. You must be 18 or over to use the site, and betting should only ever be done with money you can afford to lose.`,
  },
];

/** Generates a short, honest FAQ set for a market page from its own config - no hand-written copy per slug. */
export function generateMarketFaq(config: MarketPageConfig): FaqEntry[] {
  return [
    {
      question: `What is the "${config.h1}" market?`,
      answer: config.intro,
    },
    {
      question: `Are ${config.h1.toLowerCase()} tips guaranteed to win?`,
      answer:
        "No. Every prediction on this page is a statistical estimate, capped at 92% confidence, and can lose. See our results archive for the full, unedited track record.",
    },
    {
      question: "How often is this page updated?",
      answer:
        "Fixtures and predictions refresh automatically as our sync jobs run, and this page revalidates roughly every 15 minutes.",
    },
  ];
}
