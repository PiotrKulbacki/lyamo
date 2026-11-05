-- CreateTable
CREATE TABLE "mail_jobs" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "mail_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_jobs_nextAttemptAt_idx" ON "mail_jobs"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "mail_jobs_userId_kind_createdAt_idx" ON "mail_jobs"("userId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "mail_jobs_expiresAt_idx" ON "mail_jobs"("expiresAt");

-- AddForeignKey
ALTER TABLE "mail_jobs" ADD CONSTRAINT "mail_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_jobs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "mail_jobs" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "mail_jobs" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "mail_jobs" FROM authenticated;
  END IF;
END $$;
