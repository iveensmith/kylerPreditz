// Phrases banned from all UI copy, meta tags, and blog content per CLAUDE.md's
// content rules. Predictions are statistical estimates, never certainties.
const BANNED_PHRASES = [
  "100% sure",
  "guaranteed win",
  "guaranteed wins",
  "fixed match",
  "fixed matches",
  "sure win",
  "sure wins",
];

/**
 * Throws if any supplied text contains a banned phrase. Called from the blog
 * server actions so disallowed copy can never reach the database.
 */
export function assertNoBannedPhrases(...texts: (string | null | undefined)[]): void {
  const haystack = texts.filter(Boolean).join("\n").toLowerCase();
  const hit = BANNED_PHRASES.find((phrase) => haystack.includes(phrase));
  if (hit) {
    throw new Error(
      `Content contains a disallowed phrase ("${hit}"). Predictions are statistical estimates - remove any "sure win" / "guaranteed" / "fixed match" wording.`,
    );
  }
}
