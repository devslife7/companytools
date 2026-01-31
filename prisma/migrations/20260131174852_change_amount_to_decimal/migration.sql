-- Step 1: Add a temporary column with Decimal type
ALTER TABLE "ingredients" ADD COLUMN "amount_temp" DECIMAL(10,3);

-- Step 2: Extract numeric values from the amount string and convert to Decimal
-- This regex extracts the first number (including decimals) from the string
-- Examples: "2 oz" -> 2, "1.5 oz" -> 1.5, "0.75 oz" -> 0.75, "3 each" -> 3, "top" -> 0, "n/a" -> 0
UPDATE "ingredients" 
SET "amount_temp" = CASE
  -- Handle special values
  WHEN LOWER(TRIM("amount")) LIKE '%top%' OR LOWER(TRIM("amount")) LIKE '%n/a%' THEN 0
  -- Extract the first number (including decimals and fractions)
  -- Regex: match digits, optional decimal point, more digits, or fractions like "1/2"
  WHEN "amount" ~ '^[\d\.\/\-\s]+' THEN
    CASE
      -- Handle fractions like "1/2" -> 0.5
      WHEN "amount" ~ '\d+/\d+' THEN
        (CAST(SPLIT_PART(REGEXP_REPLACE("amount", '[^0-9/]', '', 'g'), '/', 1) AS DECIMAL) / 
         NULLIF(CAST(SPLIT_PART(REGEXP_REPLACE("amount", '[^0-9/]', '', 'g'), '/', 2) AS DECIMAL), 0))
      -- Handle ranges like "3-4" -> 3.5 (average)
      WHEN "amount" ~ '\d+-\d+' THEN
        ((CAST(SPLIT_PART(REGEXP_REPLACE("amount", '[^0-9-]', '', 'g'), '-', 1) AS DECIMAL) +
          CAST(SPLIT_PART(REGEXP_REPLACE("amount", '[^0-9-]', '', 'g'), '-', 2) AS DECIMAL)) / 2)
      -- Handle regular decimals and integers
      ELSE CAST(REGEXP_REPLACE("amount", '[^0-9.]', '', 'g') AS DECIMAL)
    END
  -- Default to 0 if no number found
  ELSE 0
END;

-- Step 3: Drop the old amount column
ALTER TABLE "ingredients" DROP COLUMN "amount";

-- Step 4: Rename the temporary column to amount
ALTER TABLE "ingredients" RENAME COLUMN "amount_temp" TO "amount";

-- Step 5: Make the column NOT NULL (it should already be populated)
ALTER TABLE "ingredients" ALTER COLUMN "amount" SET NOT NULL;
