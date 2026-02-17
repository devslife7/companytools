-- CreateTable
CREATE TABLE "liquor_prices" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "bottle_price" DECIMAL(10,2) NOT NULL,
    "bottle_size_ml" INTEGER NOT NULL DEFAULT 750,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquor_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liquor_prices_name_key" ON "liquor_prices"("name");
