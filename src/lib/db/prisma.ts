import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare Workers has a native global WebSocket that
// @neondatabase/serverless uses automatically when no constructor is
// configured - and `ws` itself cannot run there (it pulls in the native
// addon `bufferutil`, which can't load in Workers' isolate). Everywhere else
// (Node: local scripts, `next dev`/`next start`) needs this explicit
// constructor - the driver doesn't reliably use Node's own native WebSocket.
// "Cloudflare-Workers" is the documented runtime-detection signal:
// https://developers.cloudflare.com/workers/runtime-apis/web-standards/#navigatoruseragent
const isCloudflareWorkers = globalThis.navigator?.userAgent === "Cloudflare-Workers";
if (!isCloudflareWorkers) {
  neonConfig.webSocketConstructor = ws;
}

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  }
  // On Workers, a pooled connection that tries to serve more than one query
  // over its lifetime hangs outright (a documented Prisma+Neon+Workers issue:
  // https://github.com/prisma/prisma/issues/25803) rather than just being
  // slow - `maxUses: 1` forces a fresh connection per query/transaction,
  // trading reuse for actually completing. Node's long-lived process has no
  // such restriction and keeps normal pooling.
  const adapter = new PrismaNeon({ connectionString, ...(isCloudflareWorkers ? { maxUses: 1 } : {}) });
  return new PrismaClient({
    adapter,
    // Prisma's defaults (maxWait: 2000ms, timeout: 5000ms) are too tight for
    // Neon under load - nested-include reads (e.g. getLeagueBySlug) run as a
    // transaction, and Next's build-time static generation fires many of
    // these concurrently (one per league page, across several workers),
    // which was hitting "Unable to start a transaction in the given time"
    // (P2028) against Neon's pooled connection limit during `next build`.
    transactionOptions: { maxWait: 15_000, timeout: 45_000 },
  });
}

// Instantiated lazily, on first real use, rather than at import time — Next.js
// evaluates route modules during build-time page-data collection, before any
// env vars from a deploy target are necessarily available.
//
// On Workers this must NEVER be cached across requests: a worker handles many
// requests over its lifetime, but a client's underlying connection is an I/O
// object tied to the request that created it - reusing a cached one from a
// different request throws "Cannot perform I/O on behalf of a different
// request" (and can hang it). But creating a brand new connection for every
// single query within one request is its own real cost (each
// `new PrismaNeon(...)` opens a fresh WebSocket) - a request that makes
// several sequential DB calls (e.g. syncResults) was measured opening a dozen+
// WebSockets, ~11-13s each locally. `getCloudflareContext().ctx` (the Workers
// `ExecutionContext`) is a stable object unique to the current request no
// matter how deep in the call stack this runs, so it doubles as a safe
// per-request cache key - one connection per request, shared by every DB call
// within it, never reused by a different one. Node (local dev, scripts, the
// build) has no such restriction and keeps the single process-lifetime
// instance.
const workersClientsByRequest = new WeakMap<object, PrismaClient>();

function getPrismaClient(): PrismaClient {
  if (isCloudflareWorkers) {
    const { ctx } = getCloudflareContext();
    const cached = workersClientsByRequest.get(ctx);
    if (cached) return cached;
    const client = createPrismaClient();
    workersClientsByRequest.set(ctx, client);
    return client;
  }
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient();
  }
  return globalThis.__prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
