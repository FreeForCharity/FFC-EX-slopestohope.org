# Deployment procedure

Updated September 19, 2026. The cleanup branch has not been deployed. The September 18 audit recorded production at PR #54 / `81958410772660513037e0b55b53863a6508af7c`. Verify current main and the successful Pages run before a release.

## Prepare without production changes

1. Branch from current origin/main, preserving other working copies.
2. Install the frozen lockfile using Node 24 and pnpm 10.34.5; run `pnpm run build`.
3. Run `node --test tools/request-audit.test.mjs` and all three browser suites with `SITE_ROOT=out`. Review JSON evidence and external failures.
4. Review text, form IDs, donation destinations, consent behavior, CNAME, and workflow changes.
5. Prepare a draft PR identifying the tested commit and [rollback revision](migration/rollback-runbook.md).
6. Obtain Drew's explicit approval for that merge and deployment. Passing QA is not approval.

## Execute only after approval

Merge the approved PR through GitHub. A push to main runs `.github/workflows/deploy.yml`, which installs locked dependencies, validates, builds, uploads only out, and deploys GitHub Pages. The deployment job is main-only. Do not publish the repository root or change domains during a routine release.

The proposed `migration-qa.yml` runs local checks for PRs/manual branch runs with contents-read permissions only. Making it a required branch-protection check is a separate setting change, not performed here.

## Verify an approved release

Record the main SHA, Pages run URL, artifact, and smoke run. Check the 11 sitemap pages, form rendering, donation destinations, mobile navigation, Gallery, consent settings, /staff/, HTTPS, canonical URLs, sitemap.xml, robots.txt, and a true 404. Test /coosummit26 and /coosummit26/ with QR query parameters.

Rendering does not verify submission storage, email delivery, or payments. Controlled submissions need separate authorization.

The existing fleet smoke workflow can create or close issues automatically and targets production. Do not manually dispatch it during local-only preparation.

If behavior regresses, preserve evidence and obtain approval to use the rollback runbook. Redirecting to .com is no longer a fallback at all: as of November 10, 2026 .com itself returns a path-preserving 301 to .org, so pointing traffic there returns it to this site. Any rollback depending on .com serving content must disable that redirect first, and what generates it is undetermined, so locate it before planning on it. The last audit also found no COO page there.
