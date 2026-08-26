import { z } from "zod";
import { MARKETS, type Market, type MarketProbability } from "../model";
import { CONFIDENCE_DISPLAY_CAP, MAX_ADJUSTMENT } from "./constants";
import type { ContextPacket, ValidatedPick } from "./types";

const aiRawItemSchema = z.object({
  market: z.string(),
  selection: z.string(),
  confidence: z.number(),
  adjustedFrom: z.number(),
  adjustmentReason: z.string().nullable(),
  reasoning: z.string(),
  skip: z.boolean(),
});

export type ValidationResult = { ok: true; pick: ValidatedPick } | { ok: false; reason: string };
export type GroupParseResult = { ok: true; items: unknown[] } | { ok: false; reason: string };

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

/** Parses a grouped call's response into per-fixture items, checking the array shape only. */
export function parseGroupResponse(rawText: string, expectedCount: number): GroupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch {
    return { ok: false, reason: "response was not valid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, reason: "response was not a JSON array" };
  }
  if (parsed.length !== expectedCount) {
    return { ok: false, reason: `expected ${expectedCount} results, got ${parsed.length}` };
  }
  return { ok: true, items: parsed };
}

// Scans the whole packet as text, so a digit embedded in an incidental field
// (e.g. "15" from a 15:00 kickoff time) counts as "present" even though it
// isn't a stat. That's a deliberate simplicity tradeoff for a heuristic
// safety net - it still catches the case the spec cares about (a wholesale
// invented number like a goal tally that appears nowhere in the input).
function extractDigitTokens(text: string): Set<string> {
  return new Set(text.match(/\d+(\.\d+)?/g) ?? []);
}

function collectNumbers(value: unknown, out: number[]): void {
  if (typeof value === "number" && Number.isFinite(value)) {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectNumbers(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectNumbers(v, out);
  }
}

// The model routinely re-expresses a real packet number in a different but
// equally truthful form - a probability of 0.617 written as "62%", an
// expectedGoals of 1.62 written as "1.6", a probability turned into its
// derived odds (1 / probability, 2dp, per the spec). None of those are
// invented stats, so the raw-substring check above over-rejects. This builds
// every reasonable rounding/percentage/odds form of each real numeric value
// in the packet so those paraphrases are recognized as legitimate.
function buildDerivedAllowedValues(packet: ContextPacket): number[] {
  const raw: number[] = [];
  collectNumbers(packet, raw);
  const derived = new Set<number>();
  for (const n of raw) {
    derived.add(n);
    derived.add(Math.round(n));
    derived.add(Number(n.toFixed(1)));
    derived.add(Number(n.toFixed(2)));
    if (n >= 0 && n <= 1) {
      const pct = n * 100;
      derived.add(pct);
      derived.add(Math.round(pct));
      derived.add(Number(pct.toFixed(1)));
    }
    if (n > 0) {
      const odds = 1 / n;
      derived.add(Math.round(odds));
      derived.add(Number(odds.toFixed(1)));
      derived.add(Number(odds.toFixed(2)));
    }
  }
  return [...derived];
}

// Same idea as buildDerivedAllowedValues, but for the AI's own confidence
// figures (a percentage, 0-100) rather than the packet's data. Citing "2.64"
// as the odds implied by its own 38% adjusted confidence isn't an invented
// stat - it's arithmetic on a number the validator already checks and clamps
// elsewhere - so it must be allowed here too.
function buildOwnConfidenceAllowedValues(...percentages: number[]): number[] {
  const derived = new Set<number>();
  for (const pct of percentages) {
    derived.add(pct);
    derived.add(Math.round(pct));
    const fraction = pct / 100;
    derived.add(Number(fraction.toFixed(2)));
    if (pct > 0) {
      const odds = 100 / pct;
      derived.add(Math.round(odds));
      derived.add(Number(odds.toFixed(1)));
      derived.add(Number(odds.toFixed(2)));
    }
  }
  return [...derived];
}

/**
 * Validates a single already-parsed AI response item against the rules in
 * PROJECT.md's validator spec. Every AI response passes through here before
 * it can be used - no exceptions, no shortcuts.
 */
export function validateAiItem(item: unknown, basePick: MarketProbability, packet: ContextPacket): ValidationResult {
  const shape = aiRawItemSchema.safeParse(item);
  if (!shape.success) {
    return { ok: false, reason: `schema mismatch: ${shape.error.issues.map((i) => i.message).join("; ")}` };
  }
  const ai = shape.data;
  const baseConfidence = Math.round(basePick.probability * 100);

  if (!(MARKETS as readonly string[]).includes(ai.market)) {
    return { ok: false, reason: `unknown market: "${ai.market}"` };
  }

  const allowedDigits = extractDigitTokens(JSON.stringify(packet));
  const derivedAllowedValues = [
    ...buildDerivedAllowedValues(packet),
    ...buildOwnConfidenceAllowedValues(ai.confidence, ai.adjustedFrom),
  ];
  const reasoningDigits = extractDigitTokens(ai.reasoning);
  for (const digit of reasoningDigits) {
    if (allowedDigits.has(digit)) continue;
    const numeric = Number(digit);
    const matchesDerived = derivedAllowedValues.some((v) => Math.abs(v - numeric) < 1e-6);
    if (!matchesDerived) {
      return { ok: false, reason: `reasoning cites a figure not present in the input: "${digit}"` };
    }
  }

  if (ai.skip) {
    return {
      ok: true,
      pick: {
        market: ai.market as Market,
        selection: ai.selection,
        confidence: baseConfidence,
        baseConfidence,
        aiAdjusted: false,
        adjustmentReason: null,
        reasoning: ai.reasoning,
        skip: true,
      },
    };
  }

  const clamped = Math.min(Math.max(ai.confidence, baseConfidence - MAX_ADJUSTMENT), baseConfidence + MAX_ADJUSTMENT);
  const capped = Math.min(Math.round(clamped), CONFIDENCE_DISPLAY_CAP);
  const aiAdjusted = ai.market !== basePick.market || capped !== baseConfidence;

  return {
    ok: true,
    pick: {
      market: ai.market as Market,
      selection: ai.selection,
      confidence: capped,
      baseConfidence,
      aiAdjusted,
      adjustmentReason: aiAdjusted ? ai.adjustmentReason : null,
      reasoning: ai.reasoning,
      skip: false,
    },
  };
}

/** Used when the AI response can't be salvaged after a retry - the base pick, unchanged. */
export function buildFallbackPick(basePick: MarketProbability, packet: ContextPacket): ValidatedPick {
  const baseConfidence = Math.min(Math.round(basePick.probability * 100), CONFIDENCE_DISPLAY_CAP);
  return {
    market: basePick.market,
    selection: basePick.selection,
    confidence: baseConfidence,
    baseConfidence,
    aiAdjusted: false,
    adjustmentReason: null,
    reasoning: `Statistical model favors ${basePick.selection} (${packet.fixture.home} vs ${packet.fixture.away}) at ${baseConfidence}% based on expected goals of ${packet.baseModel.expectedGoals.home.toFixed(2)}-${packet.baseModel.expectedGoals.away.toFixed(2)}.`,
    skip: false,
  };
}
