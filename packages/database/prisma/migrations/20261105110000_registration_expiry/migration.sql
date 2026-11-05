-- AlterTable
ALTER TABLE "users" ADD COLUMN     "registrationExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_registrationExpiresAt_idx" ON "users"("registrationExpiresAt");
