---
name: lyamo-github
description: Work with Lyamo GitHub branches, pull requests and CI for an assigned security task. Use for GitHub inspection or publication, not every local edit.
---

# Lyamo GitHub

- Read the task card and `docs/security/INTEGRATIONS.md` GitHub section. Prefer connected GitHub tools; if insufficient, use authenticated official Git/gh. Read an installed GitHub producer skill when available and relevant. Verify actual authentication and write capabilities; installation alone is insufficient.
- Confirm remote, repository, working tree and base branch. Initial observed remote was `PiotrKulbacki/lyamo`; `dev` is the expected integration target, but inspect current settings. Use `codex/security-sxx-...` for a new branch. Do not merge another agent's unpublished work by assumption.
- Before publication inspect the final diff and required checks. A PR represents this one task, including its report and status. Do not bulk-format unrelated application files for a documentation-only change.
- Keep tokens and env contents out of output. Do not print full CLI credential configuration. Use minimal repo/PR/check permissions and the existing authenticated identity.
- Respect the assigned publication scope. Local implementation does not imply automatic merge to main or production. If creating a PR is authorised, publish the concrete reviewed result and record its URL/SHA; do not ask repeatedly for existing permission.
- PR text states the trigger, resulting behaviour, tests, migration/rollout impact and remaining limitation. With gh use a body file containing literal newlines, not shell-interpolated user text.
- Check CI results and report failures; do not call a PR ready based only on submission. Report branch, base/result SHA, PR URL and CI result in the final answer; do not push a documentation-only commit just to record them, because it reruns the full CI. The next chat can find the PR with `gh pr list --head <branch>`.

Sources for changing command behaviour: installed `gh ... --help` and official GitHub docs. No automatic new issues, chats, comments to other people, or merging outside the assigned task.
