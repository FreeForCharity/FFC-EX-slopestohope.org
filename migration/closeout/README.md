# Autonomous migration cleanup

Prepared September 19, 2026 on `codex/migration-closeout-2026-09-19`, based on released commit `81958410772660513037e0b55b53863a6508af7c` (PR #54). This is a reviewable branch; no production release or domain change was performed.

## Completed

- Researched 65 external Partners destinations. Replaced two access-limited Hyatt links with verified official pages for the same resorts. Preserved unresolved Change the Trend and challenged sites; [research and evidence](link-research.md).
- Repaired duplicate mobile-menu IDs on all nine content pages and pointed each toggle at its own mobile menu. Removed empty ID attributes.
- Visually reviewed all 37 linked Gallery photos, added factual descriptions and accessible lightbox-link names, and preserved decorative header imagery. Descriptions avoid inferred identities.
- Added static duplicate-ID and Gallery-label checks, plus keyboard activation checks for the mobile menu and Gallery.
- Corrected the browser audit so intentionally blocked requests are distinct from missing assets. A request-identity regression test ensures a blocked POST cannot hide a failing GET to the same URL.
- Made the accessibility/link adaptations survive policy regeneration and verified regeneration is idempotent for all 12 HTML files, including the staff redirect.
- Added a PR/manual migration QA workflow with read-only token permissions, all three browser suites, and report artifacts. It does not deploy or send messages. Remote CI execution is separate from the local results below.
- Replaced obsolete entry-point documentation, marked older operational guides historical, and wrote maintenance, deployment, owner-decision, and rollback instructions.
- Compared all 19 open PRs and five issues against the released tree; [proposed dispositions](backlog-review.md). Nothing was closed or commented on.
- Rebuilt the known-good rollback revision locally, verified 567 exported source files byte-for-byte, and checked all 11 routes and COO query preservation; [rollback evidence](rollback-verification.json).

## Local validation

| Check | Result | Evidence |
|---|---|---|
| Static validation and build | 11 routes, zero issues; staff redirect retained | [static-validation.json](../static-validation.json) |
| Full Edge browser audit | 22 route/viewport combinations passed at 1440 and 390 px; zero missing assets, legacy requests, external HTTP failures, JS errors, broken images, or overflow | [full report](../local-closeout-browser-audit.json) |
| Final affected-page browser check | Gallery and Partners at both widths passed after final changes | [focused report](../local-closeout-final-browser-audit.json) |
| Interactions | 19/19 passed, including keyboard Gallery activation, arrow navigation/Escape, mobile menu, hero behavior, form rendering/validation, and COO QR parameters | [interactions.json](../interactions.json) |
| Consent | 21/21 passed for existing default-on Google/HubSpot behavior, decline, re-enable, advertising denial, and forms under both preferences | [consent-validation.json](../consent-validation.json) |
| Request classification | Regression test passed; same-URL real failures remain failures | tools/request-audit.test.mjs |
| Rollback | Baseline validates/builds; 11 HTTP routes, 567 files, form IDs, redirect, and 404 checks passed | [report](rollback-verification.json) |
| Regeneration | Second application produced identical hashes for all 12 HTML files | Local regeneration check |

Local environment: Node 24.19.0, pnpm 11.19.0 using the frozen lockfile, Playwright 1.62.1, and installed Microsoft Edge. CI is configured to use the repository's pnpm 10.34.5 and bundled Chromium; local success does not claim those remote checks ran.

## Limits and next pass

The original wording, campaign totals, donor deadlines, FAQ decision, HubSpot settings, analytics policy, and production domain strategy remain unchanged. [Drew's deferred decisions](../owner-decisions.md) are consolidated for the next pass.

No real submission, CRM write, email, donation, production setting, main merge, or deployment occurred during the local tests. The new CI workflow is read-only local QA. Other pre-existing repository automations are outside this patch.

Accessibility checks cover the identified issues and tested keyboard behavior, not full WCAG certification or an assistive-technology audit. Rollback testing is local; private WordPress, Cloudflare, HubSpot, mail, and backup state still needs authorized account verification.
