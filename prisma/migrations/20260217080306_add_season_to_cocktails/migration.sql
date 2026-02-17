-- AlterTable
ALTER TABLE "cocktails" ADD COLUMN     "season" VARCHAR(50);

-- CreateIndex
CREATE INDEX "cocktails_season_idx" ON "cocktails"("season");
