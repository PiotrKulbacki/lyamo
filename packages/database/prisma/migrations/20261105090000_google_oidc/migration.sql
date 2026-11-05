BEGIN;

-- Fail before adding uniqueness if legacy spellings collide. Do not rewrite or
-- merge user records. No email values are included in the diagnostic.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users GROUP BY lower(btrim(email)) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'S02: normalized email collisions; resolve explicitly before migration';
  END IF;
END $$;

-- CreateTable
CREATE TABLE "oauth_attempts" (
    "stateHash" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_attempts_pkey" PRIMARY KEY ("stateHash")
);

-- CreateIndex
CREATE INDEX "oauth_attempts_expiresAt_idx" ON "oauth_attempts"("expiresAt");


CREATE UNIQUE INDEX "users_email_normalized_key" ON users (lower(btrim(email)));

-- These contain PKCE secrets, not public API data. Runtime uses Prisma.
ALTER TABLE "oauth_attempts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "oauth_attempts" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "oauth_attempts" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "oauth_attempts" FROM authenticated;
  END IF;
END $$;

COMMIT;
