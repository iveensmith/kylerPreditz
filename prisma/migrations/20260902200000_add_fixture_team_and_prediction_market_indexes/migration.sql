-- Team recent-form / H2H lookups filter ("homeTeamId" = x OR "awayTeamId" = x);
-- Postgres BitmapOrs the two single-column indexes. Prisma does not auto-index
-- relation FK columns on PostgreSQL, so these were missing.
CREATE INDEX "Fixture_homeTeamId_idx" ON "Fixture"("homeTeamId");
CREATE INDEX "Fixture_awayTeamId_idx" ON "Fixture"("awayTeamId");

-- sync-results (status IN (...) AND kickoffUtc <= now) and generate-predictions
-- (status = SCHEDULED AND kickoffUtc BETWEEN ...) both filter status + kickoff.
-- The leftmost prefix still serves plain status lookups, so the standalone
-- status index is redundant once this exists.
CREATE INDEX "Fixture_status_kickoffUtc_idx" ON "Fixture"("status", "kickoffUtc");
DROP INDEX "Fixture_status_idx";

-- market-coverage's groupBy(market) and the results archive's market filter.
CREATE INDEX "Prediction_market_idx" ON "Prediction"("market");
