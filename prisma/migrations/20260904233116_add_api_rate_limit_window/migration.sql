-- CreateTable
CREATE TABLE "ApiRateLimitWindow" (
    "id" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiRateLimitWindow_pkey" PRIMARY KEY ("id")
);
