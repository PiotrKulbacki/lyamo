---
name: lyamo-supabase
description: Work on Lyamo PostgreSQL/Supabase schema, migrations, storage or verification for an assigned task. Preserve Lyamo custom auth and Prisma migration ownership.
---

# Lyamo Supabase and PostgreSQL

- Read your task card and the Supabase section of `docs/security/INTEGRATIONS.md`. Discover the installed Supabase producer skill and read it for actual Supabase work; consult its current official docs/changelog as instructed. Apply only guidance relevant to the real Lyamo architecture.
- Lyamo implements auth in Next.js API and its own User/Account/Session tables. Do not switch to Supabase Auth or assume `auth.uid()` represents these users. Supabase Auth configuration cannot repair Lyamo's custom flow.
- Confirm project ref, database identity and environment before queries/migrations. Start with bounded metadata/read-only inspection; do not export customer rows, password hashes or token tables into the chat. Presence of a local env file does not establish its target.
- Prisma owns this project's schema and migration history under `packages/database/prisma`. Generate/review versioned Prisma migrations; do not add a second Supabase migration history or apply direct MCP SQL schema edits in parallel. This is the repository's explicit migration choice.
- Use a test database for integration/concurrency tests. Public API access/RLS must match the actual custom-auth architecture; never grant anon/authenticated access to session, factor or credential tables as a shortcut. Inspect exposed schemas/privileges when the task requires it.
- Use additive rollout, backfill safely and inspect duplicate e-mail collisions before constraints. Do not auto-merge accounts. Keep runtime permissions narrower than migration permissions where supported.
- Web build runs migrate deploy. Check the target before it runs. Production migration requires an identified target within the assigned release scope, backup/recovery plan and reviewed impact; do not assume any MCP connection grants permission to delete data.
- Verify migration on an isolated PostgreSQL and the affected application invariant, including simultaneous requests. Record migration names, state, rollout/rollback limits and compatibility in the report; never record connection strings.

Prefer official platform tools when available; do not claim a read-only connection can apply migrations. Follow existing authorisation without requesting a second approval for the same operation.
