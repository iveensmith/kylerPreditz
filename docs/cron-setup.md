# Cron setup

The scheduled jobs live at `/api/cron/*` and each expects
`Authorization: Bearer $CRON_SECRET`. They need an external scheduler to hit them
on a schedule.

We are on the Vercel **Hobby** plan, so Vercel Cron is not an option (Hobby =
2 jobs, once per day). We use a split:

| Job | Endpoint | Schedule | Runs on | Why |
|---|---|---|---|---|
| sync-results | `/api/cron/sync-results` | every 3 min | **cron-job.org** | Timing matters — this is what clears a finished match's live minute. Fast (<10s). |
| sync-stats | `/api/cron/sync-stats` | every 30 min | **cron-job.org** | Standings + top scorers only. Skips rows that didn't change, so a between-matchday run is a few seconds; a busy one stays well under the 30s timeout. |
| sync-team-stats | `/api/cron/sync-team-stats` | every 2h | GitHub Actions | Per-team stats (model inputs). One statistics call per team → can't finish all leagues in one run, so it's stalest-first + time-boxed. Delay-tolerant. |
| sync-fixtures | `/api/cron/sync-fixtures` | every 6h | GitHub Actions | A 20-min delay is irrelevant. |
| generate-predictions | `/api/cron/generate-predictions` | hourly | GitHub Actions | Can run longer than cron-job.org's 30s response timeout. |

> **GitHub Actions drops most scheduled runs.** On the free tier, an hourly
> `schedule:` trigger for a low-activity repo actually fires every 2–5 hours —
> observed on this repo. Anything that needs to be reliably fresh (sync-results,
> sync-stats) belongs on cron-job.org. GitHub is fine for the jobs where a
> multi-hour delay doesn't matter. The workflows are in `.github/workflows/`.

## One-time: cron-job.org jobs

1. Create a free account at https://cron-job.org (free tier: 50 jobs, 1-minute
   resolution).
2. Create **two** cronjobs, same setup, different URL + schedule:

   | Title | URL (`<domain>` = `NEXT_PUBLIC_SITE_URL`) | Schedule |
   |---|---|---|
   | `uniquepredict sync-results` | `https://<domain>/api/cron/sync-results` | `*/3 * * * *` |
   | `uniquepredict sync-stats` | `https://<domain>/api/cron/sync-stats` | `*/30 * * * *` |

3. **Advanced settings** (both jobs):
   - **Request method**: `GET`
   - **Headers**: add one — name `Authorization`, value
     `Bearer <the CRON_SECRET value from Vercel>`
   - **Treat redirects as success**: off
   - **Request timeout**: raise to the max (30s on free tier).
   - **Notifications**: enable "on failure".
4. Save. Check **History** after a few minutes — `200` with a JSON body
   (`{"fixturesChecked":0,...}` / `{"tablesChecked":32,...}`). `401` = bad
   header, `404` = bad URL.
5. Once green, disable the GitHub fallbacks so they don't double-run: GitHub →
   **Actions** → **Cron - Sync Results** and **Cron - Sync Stats** → `···` →
   **Disable workflow**. Leave the files in the repo for `workflow_dispatch`.

> **If cron-job.org logs occasional timeouts on sync-stats:** the work still
> completed on Vercel (it runs to `maxDuration` regardless of the client
> hanging up). But if it's frequent, the matchday write volume is the cause —
> check the Vercel function duration for `/api/cron/sync-stats`. The
> change-detection in `syncLeagueTables` should keep it fast; a persistent
> problem means something is rewriting every row every run.

## Rotating CRON_SECRET

If `CRON_SECRET` changes in Vercel, update the `Authorization` header on the
cron-job.org job and the `CRON_SECRET` GitHub Actions secret.

## If we upgrade to Vercel Pro

Add `vercel.json` with a `crons` array for all four endpoints (Vercel injects the
`Authorization: Bearer $CRON_SECRET` header automatically) and delete both the
cron-job.org job and the GitHub workflows.
