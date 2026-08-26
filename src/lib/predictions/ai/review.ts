import type { MarketProbability } from "../model";
import { callGroupSync } from "./client";
import { CONFIDENCE_DISPLAY_CAP, FIXTURES_PER_GROUP } from "./constants";
import type { AiLayerMode, ContextPacket, ValidatedPick } from "./types";
import { buildFallbackPick, parseGroupResponse, validateAiItem } from "./validate";

export type FixtureReview = {
  packet: ContextPacket;
  basePick: MarketProbability;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Reviews one group (<=FIXTURES_PER_GROUP) via a single synchronous call, retrying once on a parse failure. */
export async function reviewGroup(items: FixtureReview[]): Promise<ValidatedPick[]> {
  if (items.length === 0) return [];

  let parsedItems: unknown[] | null = null;
  for (let attempt = 0; attempt < 2 && !parsedItems; attempt++) {
    const rawText = await callGroupSync(items.map((i) => i.packet));
    const parsed = parseGroupResponse(rawText, items.length);
    if (parsed.ok) {
      parsedItems = parsed.items;
    } else {
      console.warn(`[ai] group parse failed (attempt ${attempt + 1}/2): ${parsed.reason}`);
    }
  }

  if (!parsedItems) {
    console.warn(`[ai] group review failed after retry, falling back to base picks for ${items.length} fixture(s)`);
    return items.map(({ packet, basePick }) => buildFallbackPick(basePick, packet));
  }

  return parsedItems.map((item, i) => {
    const { packet, basePick } = items[i];
    const result = validateAiItem(item, basePick, packet);
    if (result.ok) return result.pick;
    console.warn(`[ai] item ${i} rejected, falling back to base pick: ${result.reason}`);
    return buildFallbackPick(basePick, packet);
  });
}

/** Reviews any number of fixtures, chunked into FIXTURES_PER_GROUP-sized synchronous calls. */
export async function reviewFixtures(items: FixtureReview[]): Promise<ValidatedPick[]> {
  const results: ValidatedPick[] = [];
  for (const group of chunk(items, FIXTURES_PER_GROUP)) {
    results.push(...(await reviewGroup(group)));
  }
  return results;
}

/**
 * AI_LAYER_MODE gate: "off" skips the AI call entirely (the point of turning
 * it off is not paying for it), "reasoning_only" calls it but ignores its
 * market/selection/confidence, "full" uses its output as-is.
 */
export async function reviewFixturesWithMode(items: FixtureReview[], mode: AiLayerMode): Promise<ValidatedPick[]> {
  if (mode === "off") {
    return items.map(({ packet, basePick }) => buildFallbackPick(basePick, packet));
  }

  const aiPicks = await reviewFixtures(items);
  if (mode === "full") return aiPicks;

  // reasoning_only
  return aiPicks.map((aiPick, i) => {
    const { basePick } = items[i];
    const baseConfidence = Math.min(Math.round(basePick.probability * 100), CONFIDENCE_DISPLAY_CAP);
    return {
      market: basePick.market,
      selection: basePick.selection,
      confidence: baseConfidence,
      baseConfidence,
      aiAdjusted: false,
      adjustmentReason: null,
      reasoning: aiPick.reasoning,
      skip: aiPick.skip,
    };
  });
}
