# Sentry circular JSON alerts and DMARC report — 2026-11-05

Status: implemented; local quality checks passed. Publication and CI results are reported with the PR.

## Diagnosis and change

Reported Sentry issues: 158880621 (`Zs`) and 158880624 (`Timeout`), both reporting circular JSON serialization errors. Current main still serializes raw breadcrumbs/events in all three Sentry privacy configurations. Live SDK clients or timers can contain cycles, causing these hooks to throw before telemetry is sent. This is a plausible common cause, not a confirmed stack-trace match: Sentry API access with the existing local credential returned HTTP 401, so latest occurrences, release and full stack traces could not be checked.

Added a shared privacy inspection helper that drops telemetry when JSON serialization throws or returns no representation. Applied it to breadcrumbs, errors and transactions in server, Edge and browser configurations. Existing sensitive URL/email filtering and the minimal AUTH_RATE_LIMIT_UNAVAILABLE server signal remain intact. Unserializable telemetry is intentionally omitted rather than risking data exposure or another hook exception.

## Verification and rollout

Node 26.13.0; `npm run test:quality` passed (format, lint, typecheck, 140 unit tests). New regression coverage includes circular objects, BigInt, undefined, throwing toJSON and existing sensitive data filtering. The quality runner verified and used its isolated local test database. No schema, environment or dependency changes. Full build/integration/E2E are left to PR CI. User merge deploys the fix; recurrence should be checked in Sentry after deployment with an authorized session.

## DMARC investigation limitation

The supplied subject and filename match an aggregate DMARC report for lyamo.eu from Google. Such reports summarize sender authentication; receipt alone does not establish a delivery or security incident. The XML was not present at the supplied workspace path, so no SPF/DKIM results, message counts or source IPs were inspected. Sender authenticity cannot be verified from the displayed From address alone. No DNS or mail configuration was changed.

Reference: https://knowledge.workspace.google.com/admin/security/about-dmarc-reports
