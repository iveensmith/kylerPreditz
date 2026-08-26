-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "allMarkets" JSONB,
ADD COLUMN     "expectedGoalsAway" DOUBLE PRECISION,
ADD COLUMN     "expectedGoalsHome" DOUBLE PRECISION;
