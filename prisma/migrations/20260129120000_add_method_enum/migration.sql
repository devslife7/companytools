-- CreateEnum
CREATE TYPE "CocktailMethod" AS ENUM ('Shake', 'Build');

-- Convert existing data: case-insensitive matching for "Shake"/"Shaken", default to "Build"
UPDATE "cocktails" 
SET "method" = CASE 
  WHEN LOWER(TRIM("method")) IN ('shaken', 'shake') THEN 'Shake'
  ELSE 'Build'
END;

-- AlterTable: Change column type to enum and set default
ALTER TABLE "cocktails" 
  ALTER COLUMN "method" TYPE "CocktailMethod" USING "method"::"CocktailMethod",
  ALTER COLUMN "method" SET DEFAULT 'Build';
