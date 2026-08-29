# Cron setup

The scheduled jobs live at `/api/cron/*` and each expects
`Authorization: Bearer $CRON_SECRET`. They need an external scheduler to hit them
on a schedule.

We are on the Vercel **Hobby** plan, so Vercel Cron is not an option (Hobby =
2 jobs, once per day). We use a split:

| Job | Endpoint | Schedule | Runs on | Why |
|---|---|---|---|---|
| sync-results | `/api/cron/sync-results` | every 3 min | **cron-job.org** | Timing matters — this is what clears a finished match's live minute. Fast (<10s). |
| sync-fixtures | `/api/cron/sync-fixtures` | every 6h | GitHub Actions | A 20-min delay is irrelevant. |
| generate-predictions | `/api/cron/generate-predictions` | hourly | GitHub Actions | Can run longer than cron-job.org's 30s response timeout. |
| sync-stats | `/api/cron/sync-stats` | daily 03:00 | GitHub Actions | Delay irrelevant. |

GitHub Actions scheduled runs are routinely 10–30 min late, so only the jobs that
tolerate that stay there. The three GH workflows are in `.github/workflows/`.

## One-time: cron-job.org for sync-results

1. Create a free account at https://cron-job.org (free tier: 50 jobs, 1-minute
   resolution).
2. **Create cronjob**:
   - **Title**: `uniquepredict sync-results`
   - **URL**: `https://YOUR_PRODUCTION_DOMAIN/api/cron/sync-results`
     (the value of `NEXT_PUBLIC_SITE_URL`)
   - **Schedule**: Every 3 minutes — under "Custom", tick every minute divisible
     by 3, or use expression `*/3 * * * *`.
3. **Advanced settings**:
   - **Request method**: `GET`
   - **Headers**: add one — name `Authorization`, value
     `Bearer <the CRON_SECRET value from Vercel>`
   - **Treat redirects as success**: off
   - **Notifications**: enable "on failure" so a broken deploy or rotated secret
     is visible.
4. Save. Open the job's **History** after a few minutes — you want `200` with a
   JSON body like `{"fixturesChecked":0,...}`. A `401` means the header is wrong;
   a `404` means the URL is wrong.
5. Once you have a few green runs, **disable the GitHub fallback** so it doesn't
   double-run during matches: GitHub → **Actions** tab → **Cron - Sync Results**
   → `···` → **Disable workflow**. (Leave the file in the repo as documentation /
   a manual `workflow_dispatch` trigger.)

## Rotating CRON_SECRET

If `CRON_SECRET` changes in Vercel, update the `Authorization` header on the
cron-job.org job and the `CRON_SECRET` GitHub Actions secret.

## If we upgrade to Vercel Pro

Add `vercel.json` with a `crons` array for all four endpoints (Vercel injects the
`Authorization: Bearer $CRON_SECRET` header automatically) and delete both the
cron-job.org job and the GitHub workflows.
