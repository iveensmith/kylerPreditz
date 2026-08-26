import type { ContextPacket } from "./types";

export const SYSTEM_PROMPT = `You are a football analyst. Assess each fixture using only the supplied data.

The statistical model's probabilities are your starting point and are usually right. Adjust only when the context data gives a concrete reason - a key striker out, three matches in seven days, a dead-rubber fixture, a defence that has conceded in nine straight games.

You may adjust confidence by at most +/-10 points, and you may switch the selected market only if you state the specific data point that justifies it.

If the context adds nothing beyond what the numbers already show, return the base pick unchanged.

Never cite a statistic that is not in the input. Never reference news, transfers, or events you were not given.

Output valid JSON only, no prose outside it, no markdown fences.`;

const RESPONSE_SCHEMA_EXAMPLE = `{
  "market": "OVER_2_5",
  "selection": "Over 2.5",
  "confidence": 64,
  "adjustedFrom": 61,
  "adjustmentReason": "Away side missing first-choice centre-back; conceded in last 6 away games.",
  "reasoning": "Two or three sentences of natural analysis for the match page.",
  "skip": false
}`;

/**
 * Builds the user message for a group of fixtures. Instructs the model to
 * return a JSON array (same order, same length) of the per-fixture schema.
 */
export function buildGroupUserMessage(packets: ContextPacket[]): string {
  const fixtures = packets.map((packet, i) => `Fixture ${i + 1}:\n${JSON.stringify(packet)}`).join("\n\n");

  return `Analyze the following ${packets.length} fixture(s) independently. For each one, decide whether to confirm or adjust the base model's pick per the rules in your system prompt.

Respond with a JSON array of exactly ${packets.length} object(s), in the same order as the fixtures below. Each object must match this schema exactly:
${RESPONSE_SCHEMA_EXAMPLE}

"adjustedFrom" is the base model's confidence (baseModel.topPick.probability x 100, rounded) for that fixture. "skip": true means the fixture is too unclear to publish - when true, "market" and "selection" should still echo the base pick, and "confidence"/"adjustedFrom" may repeat the base confidence.

${fixtures}`;
}
