# Football Prediction Site — Build Spec

> This is the full project specification. `CLAUDE.md` in the same directory holds the persistent working rules and points here. Build one phase at a time; see **Build order** at the bottom.

---

## Project brief

Build a football (soccer) prediction and statistics website. Visitors land on a page of today's matches, each with a suggested betting market, odds, and a model-generated confidence percentage. Predictions are produced by our own statistical engine — not manually typed in — though an admin can override any tip.

Reference sites for structure and feature set (do not copy design or copy): todayspredict.com, passionpredict.com, focuspredict.com.

**Two things must be excellent or the project fails:**
1. **SEO** — this category lives entirely on organic search. Server-rendered pages, clean URLs, structured data, fast mobile loads.
2. **Data freshness** — fixtures and results must sync automatically. A stale homepage kills trust instantly.

---

## Stack

- **Next.js (App Router) + TypeScript** — SSG/ISR for SEO on every public page
- **Tailwind CSS** — mobile-first, most traffic is phones
- **PostgreSQL** (Neon or Supabase) + **Prisma**
- **API-Football** (api-sports.io) for fixtures, teams, standings, H2H, top scorers, injuries
- **Vercel Cron** (or GitHub Actions) for scheduled sync + prediction jobs
- **NextAuth** for user accounts; **Paystack** for VIP subscriptions (Nigerian market — Paystack over Stripe)
- Deploy on Vercel

Do not build the admin as a separate app. Use a protected `/admin` route group in the same Next.js project.

---

## Data model (Prisma)

```
League      id, apiId, name, country, logoUrl, slug, isFeatured, priority
Team        id, apiId, name, shortName, logoUrl, leagueId
Fixture     id, apiId, leagueId, homeTeamId, awayTeamId, kickoffUtc, status,
            homeScore, awayScore, htHomeScore, htAwayScore, venue
TeamStats   teamId, season, played, wins, draws, losses, goalsFor, goalsAgainst,
            homeGoalsFor, homeGoalsAgainst, awayGoalsFor, awayGoalsAgainst,
            cleanSheets, failedToScore, form (last 5 as "WWDLW")
Prediction  id, fixtureId, market, selection, odds, confidence (int 0-100),
            isVip, isBanker, reasoning (text), settledAs (WON|LOST|VOID|PENDING),
            isManualOverride, createdAt,
            baseMarket, baseSelection, baseConfidence,   // stage 1 output, kept for comparison
            aiAdjusted (bool), adjustmentReason, aiModel, generatedAt
Standing    leagueId, teamId, season, rank, played, points, goalDiff
TopScorer   leagueId, playerName, teamId, goals, appearances, season
Post        id, title, slug, body, coverImage, publishedAt, author  (blog)
User        id, email, passwordHash, role (USER|ADMIN), createdAt
Subscription userId, plan (WEEKLY|MONTHLY|LIFETIME), status, startsAt, expiresAt,
            paystackRef
```

---

## The prediction engine (`/lib/predictions/`)

This is the core of the product. It runs in **two stages**: a deterministic statistical base, then an AI layer that adjusts and explains it. Never let the AI invent numbers from nothing — it only reasons over data we hand it.

### Stage 1 — statistical base (`/lib/predictions/model/`)

Pure, testable module. No DB calls, no API calls, no LLM. **Model: Poisson with Dixon-Coles adjustment.**

1. For each team, compute **attack strength** (goals scored ÷ league average) and **defence strength** (goals conceded ÷ league average), calculated separately for home and away fixtures.
2. Weight recent matches more heavily — exponential decay, half-life around 8–10 matches. A team's form six months ago should barely count.
3. Expected goals: `λ_home = attack_home × defence_away × leagueHomeAvg`, and the mirror for away.
4. Build a score matrix from the two Poisson distributions (0–8 goals each side). Apply the Dixon-Coles low-score correction — raw Poisson underestimates 0-0, 1-0, 0-1, 1-1.
5. Derive every market by summing the relevant cells of that matrix:
   - 1X2, Double Chance (1X, X2, 12), Draw No Bet
   - Over/Under 1.5, 2.5, 3.5
   - BTTS (Yes/No)
   - Correct Score (highest-probability cell)
   - Half-time Over 0.5 (use a scaled λ, roughly 0.45 of full-match)
6. **Selection logic:** for each fixture, pick the market where the model's probability is highest AND clears a floor (default 65%). If nothing clears it, publish no tip for that fixture — an empty slot is better than a bad tip.
7. Base confidence = the model's probability, rounded. Store derived odds as `1 / probability` rounded to 2dp.

**Guardrails:** minimum 6 matches of data per team or skip the fixture. Unit-test the Poisson math against known fixtures before wiring anything else to it.

### Stage 2 — AI layer (`/lib/predictions/ai/`)

An LLM reviews each fixture with full context and either confirms or adjusts the base pick, then writes the human-readable reasoning. Use the Anthropic Messages API (`@anthropic-ai/sdk`).

**Model:** `claude-haiku-4-5` — this task is structured classification over a small context packet, not deep reasoning, and Haiku handles it at a fraction of the cost. Put the model ID in an env var (`AI_MODEL`) so it can be swapped to `claude-sonnet-5` if quality proves insufficient. Use the **Message Batches API** for the daily 05:00 job — it's asynchronous and roughly half the price, which suits a job with no latency requirement. Use the synchronous API for the hourly pre-kickoff refresh, where latency matters.

**Context packet.** Build a compact JSON object per fixture and pass it in the user message. Nothing else — the model must reason only from this:

```json
{
  "fixture": { "home": "...", "away": "...", "league": "...", "kickoffUtc": "...", "venue": "..." },
  "baseModel": {
    "expectedGoals": { "home": 1.62, "away": 1.11 },
    "markets": [
      { "market": "1X2", "selection": "Home", "probability": 0.58 },
      { "market": "OVER_UNDER_2_5", "selection": "Over 2.5", "probability": 0.61 }
    ],
    "topPick": { "market": "OVER_UNDER_2_5", "selection": "Over 2.5", "probability": 0.61 }
  },
  "homeTeam": { "form": "WWDLW", "last6Results": [...], "goalsForAvg": 1.8, "goalsAgainstAvg": 0.9,
                "homeGoalsForAvg": 2.1, "cleanSheets": 4, "leaguePosition": 3, "restDays": 6 },
  "awayTeam": { ... },
  "h2h": [ { "date": "...", "score": "2-1", "venue": "home" } ],
  "injuries": { "home": ["..."], "away": ["..."] },
  "context": { "competition": "league", "isDerby": false, "homeUnbeatenRun": 7 }
}
```

**System prompt rules** (write these explicitly into the prompt):
- You are a football analyst. Assess the fixture using only the supplied data.
- The statistical model's probabilities are your starting point and are usually right. Adjust only when the context data gives a concrete reason — a key striker out, three matches in seven days, a dead-rubber fixture, a defence that has conceded in nine straight games.
- You may adjust confidence by at most **±10 points**, and you may switch the selected market only if you state the specific data point that justifies it.
- If the context adds nothing beyond what the numbers already show, return the base pick unchanged.
- Never cite a statistic that is not in the input. Never reference news, transfers, or events you were not given.
- Output valid JSON only, no prose outside it, no markdown fences.

**Required output schema:**

```json
{
  "market": "OVER_UNDER_2_5",
  "selection": "Over 2.5",
  "confidence": 64,
  "adjustedFrom": 61,
  "adjustmentReason": "Away side missing first-choice centre-back; conceded in last 6 away games.",
  "reasoning": "Two or three sentences of natural analysis for the match page.",
  "skip": false
}
```

`skip: true` means the model judges the fixture too unclear to publish. Honour it — publish nothing for that match.

**Validator (`/lib/predictions/ai/validate.ts`).** Every response passes through this before it touches the DB:
- Parse JSON; on failure, retry once, then fall back to the base pick with auto-generated reasoning
- Clamp confidence to the base ±10 range regardless of what came back
- Hard cap displayed confidence at 92 — never publish higher
- Reject any `market` value not in the allowed enum
- Reject reasoning that contains a digit not present in the input packet (catches invented stats)
- Log every rejection so you can see how often the AI layer misbehaves

**Batching and cost.** Send 8–10 fixtures per API call to keep cost down, with the system prompt cached across calls. At ~50 fixtures a day this is a handful of calls and a few cents daily — cheap enough to run twice.

**Second pass.** Run `generate-predictions` at 05:00, then a lighter `refresh-predictions` job about 2 hours before each kickoff that re-runs only fixtures with newly reported injuries. Late team news is exactly where an AI layer beats a pure statistical model.

**Measure whether it's actually helping.** Store `baseConfidence`, `aiConfidence`, and `aiAdjusted` on every Prediction row. Add an admin view comparing hit rate of base picks vs AI-adjusted picks over the last 30/90 days. If the AI layer isn't beating the raw model after a few hundred settled tips, turn it off for selection and keep it only for writing the reasoning text. Build the toggle for this from day one (`AI_LAYER_MODE = full | reasoning_only | off`).

---

## Cron jobs

| Job | Schedule | Does |
|---|---|---|
| `sync-fixtures` | every 6h | Pull next 7 days of fixtures for tracked leagues |
| `sync-results` | every 15 min | Update scores for in-play/finished matches; settle predictions to WON/LOST |
| `sync-stats` | daily 03:00 | Refresh team stats, standings, top scorers |
| `generate-predictions` | daily 05:00 | Base model + AI layer for all fixtures in next 48h |
| `refresh-predictions` | hourly | Re-run AI layer for fixtures kicking off in 2–3h with new injury data |

Cache every API-Football response aggressively — the free tier is only 100 requests/day and you will burn through it during development. Add a `SYNC_MODE=fixtures` env flag so you can run individual jobs locally without hitting your quota.

---

## Public pages

**`/` — homepage**
- Date strip: yesterday, today, tomorrow, +3 days. Today is default.
- Tips grouped by league, each group with league flag/logo and a header row.
- Tip row (mobile-first): kickoff time · home team + logo · vs · away team + logo · tip badge · odds · confidence %. For finished matches show the score and a WON/LOST badge.
- Below the fold: Banker of the Day card, tomorrow's picks carousel, recent winning tips, league tables (tabbed EPL/La Liga/Serie A/Bundesliga/Ligue 1), top scorers, latest blog posts.
- Long-form SEO copy section at the bottom. Structure it with `<h2>`/`<h3>`, keep it honest, and include an FAQ block with FAQPage schema.

**`/[market]` — market pages.** Generated from one config array, one template. Slugs: `over-1-5-goals`, `over-2-5-goals`, `under-3-5-goals`, `both-teams-to-score`, `double-chance`, `draw-no-bet`, `correct-score`, `home-wins`, `away-wins`, `draws`, `win-either-half`, `single-bets`, `banker-of-the-day`, `2-odds`, `3-odds`, `5-odds`, `acca-tips`. Each gets its own H1, meta description, and explainer copy — but reuses the same tip-table component.

**`/[day]-predictions`** — monday through sunday. Same template, filtered by weekday.

**`/predictions/[id]/[home]-vs-[away]`** — match detail: both teams' last 5 results, H2H table, goals for/against splits, league positions, all markets with probabilities, the reasoning text.

**`/leagues`, `/leagues/[country]/[league]`** — fixtures, full table, top scorers, form guide.

**`/results`** — public archive of every settled prediction with WON/LOST. Filterable by date and market. Never delete or edit a losing tip; the transparency is the whole point, and it's also a strong differentiator against the reference sites.

**`/blog`, `/blog/[slug]`** — MDX or DB-backed.

**`/vip`** — plan comparison, Paystack checkout. **`/dashboard`** — VIP tips, locked behind an active subscription. Check subscription status server-side on every render; never gate content with CSS alone.

**Legal:** `/disclaimer`, `/terms`, `/privacy`, `/refund-policy`, `/about`, `/contact`.

---

## Admin (`/admin`, role-gated)

- Dashboard: today's tip count, win rate this week/month, API quota used
- Tips table: view all generated predictions, edit selection/odds/confidence, mark as VIP or Banker, delete. Any edit sets `isManualOverride = true`.
- Manual tip creation for fixtures the engine skipped
- League manager: toggle which leagues get synced (API quota control)
- Blog editor
- Subscribers list

---

## SEO requirements

- Every public page: unique `<title>`, meta description, canonical, OpenGraph tags
- JSON-LD: `SportsEvent` on match pages, `FAQPage` on homepage and market pages, `Article` on blog posts
- `sitemap.xml` generated dynamically, `robots.txt`
- ISR with 15-minute revalidation on tip pages; static on evergreen copy
- Semantic HTML, real `<table>` for tip lists, alt text on every logo
- Target LCP under 2.5s on 3G — `next/image` for all logos, no client-side data fetching on first paint

---

## Content and compliance

- 18+ notice and a responsible-gambling link in the footer
- A disclaimer stating predictions are statistical estimates, not guaranteed outcomes, visible on the homepage and every market page
- Do **not** write "100% sure", "fixed matches", or "guaranteed wins" anywhere. The reference sites do; it gets them Google penalties and it's a lie. Sell the model's transparency and the public results archive instead — that's the actual competitive angle.

---

## Build order — do these one at a time

**Phase 1.** Next.js + TS + Tailwind scaffold. Prisma schema and migrations. API-Football client with caching and a rate-limit guard. `sync-fixtures` and `sync-stats` jobs. Seed 5 major leagues. Verify data lands in the DB correctly — stop and confirm before moving on.

**Phase 2a.** Statistical base engine as a standalone module with unit tests. Poisson + Dixon-Coles, all market derivations, selection logic. Test against 50 historical fixtures and report the hit rate before wiring it to anything.

**Phase 2b.** AI layer: context packet builder, Anthropic client, system prompt, validator, batching. Run it over the same 50 historical fixtures and report AI-adjusted hit rate against the base hit rate. Do not proceed until that comparison exists.

**Phase 3.** Homepage — date strip, league-grouped tip table, mobile layout. `sync-results` job and prediction settlement.

**Phase 4.** Market pages, day pages, match detail, league pages, results archive. All from shared templates.

**Phase 5.** Full SEO layer: metadata, JSON-LD, sitemap, performance pass.

**Phase 6.** Auth, admin panel, tip override.

**Phase 7.** VIP tier, Paystack integration, subscriber dashboard.

**Phase 8.** Blog, Telegram/WhatsApp CTAs, analytics.

---

## Working rules

See `CLAUDE.md` — it holds the persistent rules for this repo and is loaded automatically into every session.
