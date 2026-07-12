-- AlterTable
ALTER TABLE "users" ADD COLUMN "financialMonthStartDay" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "lastQuotaResetAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "pastDueSince" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "processed_stripe_events" (
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("eventId")
);
