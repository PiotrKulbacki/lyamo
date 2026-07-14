-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "receiptImageUrl" TEXT;

-- CreateIndex
CREATE INDEX "transactions_userId_receiptImageUrl_idx" ON "transactions"("userId", "receiptImageUrl");
