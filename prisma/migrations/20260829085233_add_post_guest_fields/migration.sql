-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('ARTICLE', 'GUEST');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "listed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sponsored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'ARTICLE';

-- CreateIndex
CREATE INDEX "Post_type_listed_publishedAt_idx" ON "Post"("type", "listed", "publishedAt");
