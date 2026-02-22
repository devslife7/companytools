-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "page" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "feedback"("type");
