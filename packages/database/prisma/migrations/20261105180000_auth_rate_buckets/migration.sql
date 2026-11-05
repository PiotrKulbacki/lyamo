-- CreateTable
CREATE TABLE "auth_rate_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_rate_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "auth_rate_buckets_expiresAt_idx" ON "auth_rate_buckets"("expiresAt");

ALTER TABLE "auth_rate_buckets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "auth_rate_buckets" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "auth_rate_buckets" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "auth_rate_buckets" FROM authenticated;
  END IF;
END $$;
