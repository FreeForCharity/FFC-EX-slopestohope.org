# Slopes to Hope website

This repository maintains the static site at https://slopestohope.org. The September 18, 2026 audit recorded production release `81958410772660513037e0b55b53863a6508af7c` (PR #54), with 11 published pages and a browser redirect from /staff/ to /team/. Published pages became 12 when /pickup/ was added on October 26, 2026; alongside them the build publishes nine unlisted `noindex` routes and the /staff/ redirect, set out under [route classes](migration/README.md#route-classes). On November 10, 2026, slopestohope.com returned a path-preserving HTTP 301 to the matching slopestohope.org path on every URL tested, with Cloudflare in the request path; .com no longer serves its own content. What generates that 301 was not determined, and it matters for retirement planning — see [domain fallback and retirement](migration/rollback-runbook.md#domain-fallback-and-retirement). These are dated observations, not permission to change routing.

This is a static migration preserving .com presentation and approved .org adaptations, not a Jekyll or Next.js application. Only validated `out/` is deployed.

## Local development

Use Node 24 and pnpm 10.34.5, as pinned in CI.

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run preview
```

Preview http://127.0.0.1:4173. Edit `public/`, rebuild, and preview again. Do not edit generated `out/` or the historical root HTML.

```sh
pnpm exec playwright install chromium
node --test tools/request-audit.test.mjs
pnpm run test:browser
pnpm run test:interactions
pnpm run test:consent
```

Set `SITE_ROOT=out` for browser and interaction tests against the export. Windows may use `BROWSER_CHANNEL=msedge`. Tests block submissions and analytics collection; they do not verify actual delivery or payments.

## Working documents

- [Current migration runbook](migration/README.md)
- [Content maintenance](migration/maintenance.md)
- [Deployment](DEPLOYMENT.md)
- [Rollback and backup gaps](migration/rollback-runbook.md)
- [Cleanup and verification](migration/closeout/README.md)
- [Partner-link research](migration/closeout/link-research.md)
- [PR and issue comparison](migration/closeout/backlog-review.md)
- [Decisions reserved for Drew](migration/owner-decisions.md)

Develop on a working branch. Main merges deploy production and require Drew's explicit approval. DNS, Cloudflare, Hostinger, WordPress, Google Workspace, routing, and hosting cancellations require separate approval.

Older template and conversion documents are historical evidence. Original template instructions are preserved in `migration/history/`.
