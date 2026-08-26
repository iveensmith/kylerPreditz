import { describe, expect, it } from "vitest";
import { buildFallbackPick, parseGroupResponse, validateAiItem } from "./validate";
import type { ContextPacket } from "./types";
import type { MarketProbability } from "../model";

const BASE_PICK: MarketProbability = { market: "OVER_2_5", selection: "Over 2.5", probability: 0.61 };

const PACKET: ContextPacket = {
  fixture: { home: "Arsenal", away: "Chelsea", league: "Premier League", kickoffUtc: "2026-01-01T15:00:00Z", venue: "Emirates Stadium" },
  baseModel: {
    expectedGoals: { home: 1.62, away: 1.11 },
    markets: [BASE_PICK],
    topPick: BASE_PICK,
  },
  homeTeam: {
    form: "WWDLW",
    last6Results: [],
    goalsForAvg: 1.8,
    goalsAgainstAvg: 0.9,
    homeGoalsForAvg: 2.1,
    cleanSheets: 4,
    leaguePosition: 3,
    restDays: 6,
  },
  awayTeam: {
    form: "LDWWL",
    last6Results: [],
    goalsForAvg: 1.4,
    goalsAgainstAvg: 1.2,
    cleanSheets: 2,
    leaguePosition: 8,
    restDays: 4,
  },
  h2h: [],
  injuries: { home: [], away: [] },
  context: { competition: "league", isDerby: true },
};

function validItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    market: "OVER_2_5",
    selection: "Over 2.5",
    confidence: 64,
    adjustedFrom: 61,
    adjustmentReason: "Home side unbeaten in 7, away defence conceded in last 6.",
    reasoning: "Arsenal have won 4 of their last 6 with a strong home record. Chelsea's away form is shakier.",
    skip: false,
    ...overrides,
  };
}

describe("validateAiItem", () => {
  it("accepts a well-formed response and clamps confidence within +/-10 of base", () => {
    const result = validateAiItem(validItem({ confidence: 64 }), BASE_PICK, PACKET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pick.confidence).toBe(64);
      expect(result.pick.baseConfidence).toBe(61);
      expect(result.pick.aiAdjusted).toBe(true);
    }
  });

  it("clamps confidence that exceeds +10 of base down to base+10", () => {
    const result = validateAiItem(validItem({ confidence: 95 }), BASE_PICK, PACKET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pick.confidence).toBe(71); // 61 + 10
  });

  it("clamps confidence that undercuts base-10 up to base-10", () => {
    const result = validateAiItem(validItem({ confidence: 10 }), BASE_PICK, PACKET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pick.confidence).toBe(51); // 61 - 10
  });

  it("never publishes above the display cap even if base+10 exceeds it", () => {
    const highBase: MarketProbability = { market: "DOUBLE_CHANCE_1X", selection: "Home or Draw", probability: 0.9 };
    const result = validateAiItem(validItem({ market: "DOUBLE_CHANCE_1X", selection: "Home or Draw", confidence: 100 }), highBase, PACKET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pick.confidence).toBe(92);
  });

  it("rejects a market outside the allowed enum", () => {
    const result = validateAiItem(validItem({ market: "OVER_UNDER_2_5" }), BASE_PICK, PACKET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/unknown market/);
  });

  it("rejects reasoning that cites a digit not present in the input packet", () => {
    // 23 doesn't appear anywhere in PACKET, including inside date/time strings.
    const result = validateAiItem(
      validItem({ reasoning: "Their star striker has scored 23 goals this season, a huge tally." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not present in the input/);
  });

  it("accepts reasoning whose digits all trace back to the input packet", () => {
    // "6" appears in restDays:6, "4" in cleanSheets:4 - both legitimately in PACKET.
    const result = validateAiItem(
      validItem({ reasoning: "Home side has had 6 days rest and kept 4 clean sheets recently." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts a probability re-expressed as a percentage", () => {
    // BASE_PICK.probability is 0.61 -> the model paraphrasing it as "61%" is truthful, not invented.
    const result = validateAiItem(
      validItem({ reasoning: "The model gives this a 61% chance based on home scoring form." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts an expected-goals figure rounded to one decimal place", () => {
    // expectedGoals.home is 1.62 in PACKET - "1.6" is a faithful rounding, not a fabrication.
    const result = validateAiItem(
      validItem({ reasoning: "Home side is expected to score around 1.6 goals here." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts a probability re-expressed as derived odds", () => {
    // 1 / 0.61 rounded to 2dp is 1.64, per the spec's odds derivation.
    const result = validateAiItem(
      validItem({ reasoning: "That prices out to odds of roughly 1.64 on the base model." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts odds derived from the AI's own adjusted confidence, not just packet data", () => {
    // confidence 38 -> implied odds 100/38 = 2.63, arithmetic on the AI's own (already-clamped) figure.
    const result = validateAiItem(
      validItem({ confidence: 38, reasoning: "That prices out at odds of roughly 2.63 given our adjusted view." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(true);
  });

  it("still rejects a genuinely invented figure even with tolerant matching", () => {
    const result = validateAiItem(
      validItem({ reasoning: "Their star striker has scored 23 goals this season, a huge tally." }),
      BASE_PICK,
      PACKET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not present in the input/);
  });

  it("rejects malformed shapes (missing fields, wrong types)", () => {
    expect(validateAiItem({ market: "OVER_2_5" }, BASE_PICK, PACKET).ok).toBe(false);
    expect(validateAiItem(validItem({ confidence: "high" }), BASE_PICK, PACKET).ok).toBe(false);
  });

  it("honours skip:true without applying confidence logic", () => {
    const result = validateAiItem(validItem({ skip: true, confidence: 999 }), BASE_PICK, PACKET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pick.skip).toBe(true);
      expect(result.pick.confidence).toBe(61);
    }
  });

  it("marks aiAdjusted false when the AI returns the base pick unchanged", () => {
    const result = validateAiItem(validItem({ confidence: 61, adjustmentReason: null }), BASE_PICK, PACKET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pick.aiAdjusted).toBe(false);
      expect(result.pick.adjustmentReason).toBeNull();
    }
  });
});

describe("parseGroupResponse", () => {
  it("parses a plain JSON array", () => {
    const result = parseGroupResponse(JSON.stringify([validItem(), validItem()]), 2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.items.length).toBe(2);
  });

  it("strips markdown code fences defensively", () => {
    const fenced = "```json\n" + JSON.stringify([validItem()]) + "\n```";
    const result = parseGroupResponse(fenced, 1);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid JSON", () => {
    expect(parseGroupResponse("not json", 1).ok).toBe(false);
  });

  it("rejects a non-array JSON value", () => {
    expect(parseGroupResponse(JSON.stringify(validItem()), 1).ok).toBe(false);
  });

  it("rejects a length mismatch", () => {
    const result = parseGroupResponse(JSON.stringify([validItem()]), 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/expected 2/);
  });
});

describe("buildFallbackPick", () => {
  it("returns the base pick unchanged, with no invented reasoning", () => {
    const pick = buildFallbackPick(BASE_PICK, PACKET);
    expect(pick.market).toBe(BASE_PICK.market);
    expect(pick.selection).toBe(BASE_PICK.selection);
    expect(pick.confidence).toBe(61);
    expect(pick.aiAdjusted).toBe(false);
    expect(pick.skip).toBe(false);
  });

  it("caps the fallback confidence too", () => {
    const highBase: MarketProbability = { market: "HOME_WIN", selection: "Home", probability: 0.98 };
    const pick = buildFallbackPick(highBase, PACKET);
    expect(pick.confidence).toBe(92);
  });
});
