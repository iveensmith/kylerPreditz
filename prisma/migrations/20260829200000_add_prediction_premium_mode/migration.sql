-- CreateEnum
CREATE TYPE "PremiumMode" AS ENUM ('AUTO', 'ALWAYS', 'NEVER');

-- AlterTable: add premium, seed from the old isVip flag, then drop isVip
ALTER TABLE "Prediction" ADD COLUMN     "premium" "PremiumMode" NOT NULL DEFAULT 'AUTO';

UPDATE "Prediction" SET "premium" = 'ALWAYS' WHERE "isVip" = true;

DROP INDEX "Prediction_isVip_idx";

ALTER TABLE "Prediction" DROP COLUMN "isVip";

-- CreateIndex
CREATE INDEX "Prediction_premium_idx" ON "Prediction"("premium");
