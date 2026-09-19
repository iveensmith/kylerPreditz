-- CreateTable
CREATE TABLE "PageSeo" (
    "path" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageSeo_pkey" PRIMARY KEY ("path")
);

-- AlterTable: amount actually paid (kobo). Null for rows created before this column
-- existed and for admin-granted subscriptions.
ALTER TABLE "Subscription" ADD COLUMN "amountKobo" INTEGER;
