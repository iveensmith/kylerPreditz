import { prisma } from "@/lib/db/prisma";
import type { z } from "zod";

const BASE_URL = "https://v3.football.api-sports.io";
export const DAILY_QUOTA = 7500; // api-sports.io Pro plan (confirmed via /status: x-ratelimit-requests-limit)
const MAX_RETRIES = 2;

// api-sports.io Pro plan caps at 300 requests/minute (see x-ratelimit-limit on
// any response). Loops that hit many endpoints in quick succession (e.g.
// syncing stats for every team in a league) need throttling, or they 429.
const RATE_LIMIT_PER_MINUTE = 300;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_SAFETY_MARGIN = 1;
const requestTimestamps: number[] = [];

async function throttleForRateLimit(): Promise<void> {
  const maxRequests = RATE_LIMIT_PER_MINUTE - RATE_LIMIT_SAFETY_MARGIN;
  for (;;) {
    const now = Date.now();
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] >= RATE_LIMIT_WINDOW_MS) {
      requestTimestamps.shift();
    }
    if (requestTimestamps.length < maxRequests) {
      requestTimestamps.push(now);
      return;
    }
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - requestTimestamps[0]) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

export class ApiFootballQuotaExceededError extends Error {
  constructor() {
    super("API-Football daily quota exhausted and no cached response is available.");
    this.name = "ApiFootballQuotaExceededError";
  }
}

type RequestOptions = {
  /** How long a successful response stays fresh, in seconds. */
  ttlSeconds: number;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildCacheKey(path: string, params: Record<string, string | number>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${path}?${sorted}`;
}

async function readCache(cacheKey: string) {
  return prisma.apiCache.findUnique({ where: { cacheKey } });
}

async function writeCache(cacheKey: string, endpoint: string, response: unknown, ttlSeconds: number) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.apiCache.upsert({
    where: { cacheKey },
    create: { cacheKey, endpoint, response: response as object, expiresAt },
    update: { response: response as object, expiresAt, fetchedAt: new Date() },
  });
}

/** Returns true if the call is allowed, having reserved one unit of quota. */
async function tryReserveQuota(): Promise<boolean> {
  const date = todayUtc();
  const existing = await prisma.apiQuotaUsage.findUnique({ where: { date } });
  if (existing && existing.count >= DAILY_QUOTA) return false;

  await prisma.apiQuotaUsage.upsert({
    where: { date },
    create: { date, count: 1 },
    update: { count: { increment: 1 } },
  });
  return true;
}

/** Returns a description of the API-level error(s), or null if the response reports none. */
function hasApiFootballErrors(json: unknown): string | null {
  if (typeof json !== "object" || json === null || !("errors" in json)) return null;
  const errors = (json as { errors: unknown }).errors;
  if (Array.isArray(errors)) {
    return errors.length > 0 ? JSON.stringify(errors) : null;
  }
  if (typeof errors === "object" && errors !== null) {
    const keys = Object.keys(errors);
    return keys.length > 0 ? JSON.stringify(errors) : null;
  }
  return null;
}

async function fetchFromUpstream(path: string, params: Record<string, string | number>): Promise<unknown> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY is not set. Add it to .env.local.");
  }

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await throttleForRateLimit();
      const res = await fetch(url, {
        headers: { "x-apisports-key": apiKey },
      });

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`API-Football returned ${res.status}`);
        await new Promise((resolve) => setTimeout(resolve, 1500 * 2 ** attempt));
        continue;
      }

      if (!res.ok) {
        throw new Error(`API-Football request failed: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const apiErrors = hasApiFootballErrors(json);
      if (apiErrors) {
        // API-Football sometimes reports rate limiting (and other failures) as a
        // 200 with a populated `errors` field rather than an HTTP error status.
        // Treat it the same as a 429: retry, and never let it reach the cache.
        lastError = new Error(`API-Football returned an error: ${apiErrors}`);
        await new Promise((resolve) => setTimeout(resolve, 1500 * 2 ** attempt));
        continue;
      }

      return json;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("API-Football request failed");
}

/**
 * The only entry point for talking to API-Football. Every call is cached in
 * Postgres and counted against the daily quota; cache hits are free.
 */
export async function apiFootballRequest<T extends z.ZodTypeAny>(
  path: string,
  params: Record<string, string | number>,
  schema: T,
  { ttlSeconds }: RequestOptions,
): Promise<z.infer<T>> {
  const cacheKey = buildCacheKey(path, params);
  const cached = await readCache(cacheKey);

  if (cached && cached.expiresAt > new Date()) {
    return schema.parse(cached.response);
  }

  const allowed = await tryReserveQuota();
  if (!allowed) {
    if (cached) {
      console.warn(`[api-football] quota exhausted, serving stale cache for ${cacheKey}`);
      return schema.parse(cached.response);
    }
    throw new ApiFootballQuotaExceededError();
  }

  const raw = await fetchFromUpstream(path, params);
  const parsed = schema.parse(raw);
  await writeCache(cacheKey, path, raw, ttlSeconds);
  return parsed;
}
