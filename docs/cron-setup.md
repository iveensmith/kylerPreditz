# Cron setup

The scheduled jobs live at `/api/cron/*` and each expects
`Authorization: Bearer $CRON_SECRET`.

## Cloudflare Cron Triggers (current)

Now that hosting is on Cloudflare Workers, all 5 jobs run on native
**Cron Triggers** — no external scheduler needed. They're declared in
`wrangler.jsonc`'s `triggers.crons`, and `worker-entry.js` exports a
`scheduled(event, env, ctx)` handler that maps `event.cron` to the matching
route and invokes it in-process (a synthetic `Request` passed straight to
OpenNext's own `fetch` handler — no network round-trip, and the real route
handler, bearer-token check included, stays the single source of truth).

| Job | Endpoint | Schedule |
|---|---|---|
| sync-results | `/api/cron/sync-results` | `*/3 * * * *` |
| sync-stats | `/api/cron/sync-stats` | `*/30 * * * *` |
| sync-fixtures | `/api/cron/sync-fixtures` | `0 */6 * * *` |
| sync-team-stats | `/api/cron/sync-team-stats` | `0 */2 * * *` |
| generate-predictions | `/api/cron/generate-predictions` | `0 * * * *` |

**Changing the schedule**: edit `wrangler.jsonc`'s `triggers.crons` array
*and* `worker-entry.js`'s `CRON_ROUTE_BY_SCHEDULE` map (the cron expression
string is the lookup key between them — they must match exactly).

**Testing a trigger manually** without waiting for the real schedule: via
Wrangler's local dev server, Cloudflare's Local Explorer exposes a dispatch
endpoint —
```
curl -X POST "http://127.0.0.1:8787/cdn-cgi/local/explorer/api/local/scheduled?worker=uniquepredict" \
  -H "Content-Type: application/json" -d '{"cron":"*/3 * * * *"}'
```
On the real deployment, just hit the HTTP route directly with the bearer
token (same as before):
```
curl -H "Authorization: Bearer $CRON_SECRET" https://uniquepredict.com/api/cron/sync-results
```

## Decommissioned: cron-job.org / GitHub Actions

Before the Cloudflare migration, Vercel Hobby's 2-jobs/day Cron limit meant
splitting the schedule across **cron-job.org** (sync-results, sync-stats —
timing-sensitive) and **GitHub Actions** (the other three — delay-tolerant,
and GitHub's free tier throttles hourly triggers to firing every 2-5h on a
low-activity repo, which is why those jobs tolerated a long delay).

Both are now decommissioned (2026-10-16) - `.github/workflows/cron-*.yml`
deleted, and the two cron-job.org jobs cancelled - after confirming
Cloudflare Cron Triggers firing correctly in production via `wrangler
tail`. The HTTP routes still work unchanged for manual/debugging use
(`curl` with the bearer token, as above); nothing else depends on
cron-job.org or these workflow files anymore.

## Rotating CRON_SECRET

Update it via `wrangler secret put CRON_SECRET` (Cloudflare), and the
cron-job.org job header / GitHub Actions secret too, until those are
decommissioned.
