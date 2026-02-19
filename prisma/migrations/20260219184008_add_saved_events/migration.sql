-- CreateTable
CREATE TABLE "saved_events" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "recipes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_events_pkey" PRIMARY KEY ("id")
);
