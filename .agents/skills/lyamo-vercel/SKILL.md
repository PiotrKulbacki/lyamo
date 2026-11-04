---
name: lyamo-vercel
description: Inspect or change Lyamo Vercel environments, jobs, deployment and runtime verification for an assigned task. Use only when work touches Vercel.
---

# Lyamo Vercel

- Read the task card and Vercel section of `docs/security/INTEGRATIONS.md`. Select an installed Vercel producer skill only for the relevant operation (e.g. env-vars, deployments-cicd, vercel-cli, verification); avoid loading the entire library. Use official current docs/CLI help.
- Discover actual tools and verify team, project, Production Branch and target environment. Never infer production from the local branch name. MCP may lack a needed write capability; use official authenticated CLI/API only when needed.
- Keep Production, Preview and Development env separate. Do not print, copy into reports or commit secret values. Verify by variable name/presence and behaviour. Public NEXT_PUBLIC values are built into browser assets; a secret must not use that prefix.
- Lyamo web build runs database migrate deploy before Next build. A preview pointing to production can mutate production during build. Confirm isolated DB, Stripe test mode and test email/Redis before preview.
- Google OAuth needs a stable registered callback origin. Deployment protection must remain enabled where intended; do not globally disable it to make smoke tests easy. Verify trusted IP headers against actual platform behaviour.
- Before assigned release prepare exact SHA, migration order, mobile compatibility, target, rollback and checks. Deploy when already authorised for that identified environment; otherwise leave a concrete ready-to-deploy result and state the missing decision.
- After deployment verify ready status, deployed SHA, relevant logs and controlled smoke tests. No live-customer test charges or destructive smoke data. Retry only after diagnosing errors; a submitted deployment is not proof of success.
- Record deployment URL/ID, environment, SHA, migrations, result and unresolved limitations. Monitoring configuration and alerts must avoid auth secrets and financial data; no implied background monitoring after the chat ends.
