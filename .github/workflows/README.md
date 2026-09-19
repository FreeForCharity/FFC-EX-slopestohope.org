# Website workflows

- `deploy.yml`: main pushes build and deploy only validated out. Main merges and production runs require Drew's approval.
- `migration-qa.yml`: proposed PR/manual local QA with Node 24, pnpm 10.34.5, locked Playwright, Chromium, static validation, request-classification regression, and browser/interaction/consent suites. Read-only token, no deployment or messages.
- `post-deploy-smoke.yml`: existing fleet production checks and automatic issue management. Do not dispatch during local-only preparation.

See [deployment](../../DEPLOYMENT.md) and [rollback](../../migration/rollback-runbook.md). The [old template guide](../../migration/history/template-workflows.md) is historical. No test.yml or Lighthouse workflow exists in this checkout.
