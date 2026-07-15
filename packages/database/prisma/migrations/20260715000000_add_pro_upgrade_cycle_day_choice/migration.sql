ALTER TABLE "users"
ADD COLUMN "financialMonthStartDayBeforePro" INTEGER,
ADD COLUMN "pendingFinancialCycleDayChoice" BOOLEAN NOT NULL DEFAULT false;
