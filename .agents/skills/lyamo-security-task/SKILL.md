---
name: lyamo-security-task
description: Implement exactly one assigned S00–S10 task in the Lyamo account security programme, verify it, and hand off to the next user-created chat. Use for this programme, not unrelated development.
---

# One agent, one Lyamo security task

Use repository-relative paths below from the Lyamo root. User authorisation and scope are recorded in `docs/security/README.md`; do not request approval again for an already authorised routine implementation choice.

1. Read `AGENTS.md`, `.cursorrules`, `docs/security/STATUS.md`, your assigned `docs/security/tasks/Sxx.md`, and the latest predecessor report. Read relevant entries in `DECISIONS.md`; do not load all task cards or repeat the audit.
2. Check branch, working changes and predecessor commit. Preserve other work. A new chat/worktree does not automatically inherit uncommitted changes; establish the actual code baseline before editing. Use a `codex/` branch when creating one; do not commit/push as a substitute for checking the work.
3. Mark this task in progress and implement only its stated outcome. Do not spawn subagents, start the next task or create a new chat. The user opens the next chat. A small dependency fix needed for this task belongs here; unrelated work belongs in the handoff.
4. Load only the local platform skill relevant to the operation. It may route to an installed producer skill. Discover current tool capabilities before promising access. Missing optional external access does not block independent local work; incomplete acceptance criteria remain explicitly incomplete.
5. Use isolated test data and a known database. Web build performs migrations. Inspect target identity before build or migration, without printing secret values. Keep Prisma migrations versioned and compatible with rollout; no parallel ad hoc schema edits.
6. Test the risk, including concurrency and negative paths where specified. For code changes run the repository CI checks in order: format, lint, typecheck, test, then safe-target build when relevant. PostgreSQL integration tests are required for atomic token/session claims; mocks alone do not prove them. Keep PL/EN/DE/ES and mobile consistent. Report blocked checks honestly.
7. Update `STATUS.md`, relevant durable decisions, and `reports/Sxx.md` using `HANDOFF_TEMPLATE.md`. Record baseline/result commit or uncommitted state, modified contracts, migration/deployment state, checks and concrete remaining risks. Never store secrets, real users or full tool transcripts.
8. Final answer: outcome, checks, deployment state, remaining blocker if any, and a copyable prompt for the next assigned task. If unfinished, hand off this same ID. Do not claim deployment from a local code change.

Local implementation is authorised when Sxx is assigned. Remote writes must be within that task and target a verified environment; follow any existing deployment authorisation without repeatedly asking. Unexpected destructive actions, live customer charges or mass credential removal are not implied by a generic fix request. Prepare the exact reviewable action before seeking any missing decision.

Platform instructions: sibling skills `lyamo-github`, `lyamo-supabase`, `lyamo-vercel`, `lyamo-stripe`. Connection guide: `docs/security/INTEGRATIONS.md`. Skills do not grant permissions or run continuous monitoring.
