# Rollback runbook

Prepared September 19, 2026. No production rollback, domain change, or hosting cancellation was performed.

## Known-good static revision

Baseline: `81958410772660513037e0b55b53863a6508af7c`, released by [PR #54](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/54).

The September 18 audit recorded successful [Pages deployment](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/actions/runs/35378887770) and [smoke run](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/actions/runs/35378980424). Artifact retention is not guaranteed; retain the source revision and lockfile.

This pass archived that exact Git revision into a local scratch directory, validated it, rebuilt out, compared every exported source file byte-for-byte, and exercised all 11 pages over local HTTP. The COO slash redirect preserved both QR parameters; all three form IDs remained present; /staff/ kept its HTML redirect; unknown routes returned 404. See [machine-readable evidence](closeout/rollback-verification.json). This proves a local rebuild and route smoke test, not a production restore or private-backup drill.

## Preferred response to a site-code regression

1. Record the failing URL, symptoms, deployed SHA, workflow run, and time. Preserve screenshots/logs. Stop further releases.
2. Compare the regression against the known-good revision and identify whether the cause is site code, third-party service, or production configuration. Code rollback cannot restore HubSpot configuration or an external service outage.
3. Create a new working branch from current main. Prepare a revert of the specific bad release, retaining later unrelated changes. For a merge commit, inspect parents before choosing a mainline; for a squash commit, revert that commit. Do not force-push or reset main.
4. Build and test the rollback branch. Confirm all 11 routes, COO QR parameters, exact three forms, donation destinations, consent behavior, and absence of legacy host assets. Keep the COO feature.
5. Present the rollback diff, impact, known-good SHA, tests, and expected recovery to Drew. Obtain explicit approval for the production merge/deploy.
6. After approval, merge through the normal Pages workflow. Verify the deployed revision and affected behavior, then record recovery evidence.
7. If the revert does not resolve the incident, preserve the evidence and investigate the actual service/configuration layer. Do not switch domains as an improvised fallback.

## Reproduce the local baseline check

From a clean working branch with locked dependencies installed:

```sh
git archive --format=tar --output=.migration-cache/rollback-baseline.tar 81958410772660513037e0b55b53863a6508af7c
```

The commands above create the required parent and extraction directories before writing or unpacking the archive. Run the archived revision's own tools/validate.mjs and tools/build.mjs with `.migration-cache/rollback-baseline` as the working directory. Then, from the cleanup repository root, run `node tools/verify-rollback.mjs`. The scratch directory can resolve the parent checkout's locked Node dependencies. In a separate checkout, install its frozen lockfile first.

The archive and generated export are local ignored artifacts, not a substitute for an independently retained backup.

## Backup register to complete with account access

| System | Required retained material | Status |
|---|---|---|
| Static website | Git revision, lockfile, deploy workflow, Pages configuration, and exported artifact/checksums | Revision rebuilt locally; report contains page hashes; private Pages settings and artifact retention not verified |
| WordPress/Hostinger | Complete database, uploads/media, themes/plugins, configuration, backup date, off-host copy, and tested restore location | Not verified; owner/location pending |
| Cloudflare | DNS export, redirect/rules configuration, proxy/TLS settings, and disabled prior .org-to-.com rules | Private dashboard configuration and backup location not verified |
| HubSpot | Three form definitions, property mappings, notifications, subscription/workflow settings, and ownership | Rendered forms verified; configuration export/restore evidence pending |
| Google Workspace | Baseline MX/TXT/CNAME mail records, SPF/DKIM/DMARC configuration, and authorized mail administrator | Public MX was observed in earlier audit; delivery and private configuration not verified |
| Analytics/Search Console | Property ownership, measurement configuration, domain verification, and reporting access | Private access verification pending |

Drew is the production approver. Technical operator, backup custodian, notification owner, and recovery contacts still need assignment. Do not claim a backup exists until its location, date, access, and restoration procedure are recorded.

## Domain fallback and retirement

The former .org-to-.com redirect is incomplete rollback coverage: .com/coosummit26 was missing in the latest audit. A domain fallback requires its own approved route map, QR/query checks, and feature-gap resolution. Preserve Google Workspace mail records.

Do not cancel Hostinger, delete WordPress, remove backups, or change renewal settings during cleanup. A retirement plan must confirm route coverage, independent recoverable backups, integration dependencies, retention needs, owners, and Drew's explicit approval.
