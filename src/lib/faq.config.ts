import type { MarketPageConfig } from "./markets.config";
import type { FaqEntry } from "./structured-data";

export const HOMEPAGE_FAQ: FaqEntry[] = [
  {
    question: "How are these football predictions generated?",
    answer:
      "Every tip runs through a two-stage engine. First, a statistical model (Poisson distributions with a Dixon-Coles low-score adjustment) computes a probability for every market from each team's recent form. Then an AI layer reviews that base pick against the same data and can adjust it by up to 10 points if there's a concrete reason - an injury, a fixture pile-up, a defensive record - never on a whim.",
  },
  {
    question: "How is the confidence percentage calculated?",
    answer:
      "Confidence is the model's estimated probability for the published selection, rounded to the nearest whole number. It's capped at 92% - we never display a higher figure, no matter what the model or the AI review produces.",
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
