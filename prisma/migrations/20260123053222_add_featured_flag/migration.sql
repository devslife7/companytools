-- AlterTable
ALTER TABLE "cocktails" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "cocktails_featured_idx" ON "cocktails"("featured");
