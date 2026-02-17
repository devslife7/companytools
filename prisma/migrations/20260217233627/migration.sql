/*
  Warnings:

  - You are about to drop the column `preferred_unit` on the `ingredients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "preferred_unit",
ADD COLUMN     "order_unit" VARCHAR(50);
