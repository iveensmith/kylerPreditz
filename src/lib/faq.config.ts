import type { MarketPageConfig } from "./markets.config";
import type { FaqEntry } from "./structured-data";

export const HOMEPAGE_FAQ: FaqEntry[] = [
  {
    question: "How are these football predictions generated?",
    answer:
      "Every tip comes from a statistical model. We fit Poisson distributions to each team's recent scoring and conceding rates - calculated separately for home and away matches and weighted toward the most recent games - then apply a Dixon-Coles adjustment that corrects the low-scoring results raw Poisson tends to underrate. That produces a probability for every market on the fixture, and we publish the one the model rates highest, provided it clears our confidence floor.",
  },
  {
    question: "How is the confidence percentage calculated?",
    answer:
      "Confidence is the model's estimated probability for the published selection, rounded to the nearest whole number. It's capped at 92% - we never display a higher figure, and a 92% pick still loses roughly one time in twelve.",
  },
  {
    question: "Are these predictions guaranteed to win?",
    answer:
      "No. Every tip is a statistical estimate, not a certainty. Betting carries risk, and even a 92% confidence pick loses sometimes - that's what the number means. Never stake more than you can afford to lose.",
  },
  {
    question: "What happens when a tip loses?",
    answer:
      "It stays on the site. Our results archive shows every published prediction, win or lose, with nothing ever removed or edited after the fact.",
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
