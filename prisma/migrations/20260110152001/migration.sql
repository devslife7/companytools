-- CreateTable
CREATE TABLE "cocktails" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "garnish" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" VARCHAR(100),

    CONSTRAINT "cocktails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "cocktail_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amount" VARCHAR(100) NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cocktails_name_key" ON "cocktails"("name");

-- CreateIndex
CREATE INDEX "cocktails_name_idx" ON "cocktails"("name");

-- CreateIndex
CREATE INDEX "cocktails_is_active_idx" ON "cocktails"("is_active");

-- CreateIndex
CREATE INDEX "cocktails_category_idx" ON "cocktails"("category");

-- CreateIndex
CREATE INDEX "ingredients_cocktail_id_idx" ON "ingredients"("cocktail_id");

-- CreateIndex
CREATE INDEX "ingredients_name_idx" ON "ingredients"("name");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_cocktail_id_fkey" FOREIGN KEY ("cocktail_id") REFERENCES "cocktails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
