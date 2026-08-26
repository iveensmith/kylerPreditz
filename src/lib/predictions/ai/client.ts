import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_AI_MODEL } from "./constants";
import { buildGroupUserMessage } from "./prompt";
import { SYSTEM_PROMPT } from "./prompt";
import type { ContextPacket } from "./types";

const MAX_TOKENS_PER_GROUP = 4096;

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

function getModel(): string {
  return process.env.AI_MODEL || DEFAULT_AI_MODEL;
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** Synchronous call reviewing one group of fixtures (8-10 per spec). Used for the hourly refresh and for testing. */
export async function callGroupSync(packets: ContextPacket[]): Promise<string> {
  const message = await getClient().messages.create({
    model: getModel(),
    max_tokens: MAX_TOKENS_PER_GROUP,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildGroupUserMessage(packets) }],
  });
  return extractText(message);
}

/**
 * Submits multiple fixture groups as one Message Batch (the daily 05:00 job,
 * per spec - async and roughly half price, with no latency requirement).
 * Returns the batch ID; call retrieveBatchResults later to collect output.
 */
export async function submitGroupBatch(groups: ContextPacket[][]): Promise<string> {
  const batch = await getClient().messages.batches.create({
    requests: groups.map((packets, i) => ({
      custom_id: `group-${i}`,
      params: {
        model: getModel(),
        max_tokens: MAX_TOKENS_PER_GROUP,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: buildGroupUserMessage(packets) }],
      },
    })),
  });
  return batch.id;
}

export type BatchStatus =
  | { done: false }
  | { done: true; results: Map<string, string> };

/** Polls a batch and, once finished, returns each group's raw text keyed by custom_id ("group-0", ...). */
export async function retrieveBatchResults(batchId: string): Promise<BatchStatus> {
  const anthropic = getClient();
  const batch = await anthropic.messages.batches.retrieve(batchId);
  if (batch.processing_status !== "ended") return { done: false };

  const results = new Map<string, string>();
  for await (const item of await anthropic.messages.batches.results(batchId)) {
    if (item.result.type === "succeeded") {
      results.set(item.custom_id, extractText(item.result.message));
    } else {
      console.warn(`[ai] batch item ${item.custom_id} did not succeed: ${item.result.type}`);
    }
  }
  return { done: true, results };
}
