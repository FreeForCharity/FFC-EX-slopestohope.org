# Backlog comparison — September 19, 2026

Read-only review against release `81958410772660513037e0b55b53863a6508af7c` (PR #54): 19 open PRs and five open non-PR issues. Metadata and per-file comparisons are recorded in [backlog-snapshot.json](backlog-snapshot.json). PR descriptions were checked against diffs and current files; they are not treated as current production documentation. Nothing was merged, closed, or commented on.

## Pull requests

| PR | Comparison with the released tree | Proposed disposition |
|---|---|---|
| [#51 Partners cleanup](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/51) | Partners, Team, Donors, FAQ, Gallery, and Our Story HTML from this proposal already match release byte-for-byte. Home, Contact, COO, and validator have newer form/runtime/validation corrections in #54. | Closure candidate as superseded; do not reintroduce older embeds or validator exceptions. |
| [#50 COO page](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/50) | Feature shipped in #54 with subsequent exact-embed, zoom, and copied-Contact-identity corrections. The older page is not byte-identical. | Closure candidate as superseded. |
| [#49 navigation/zoom](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/49) | Typo and zoom corrections shipped, but unique mobile menu IDs were absent in #54. PR head also contains a QA workflow despite its description saying temporary QA was removed. | This cleanup carries forward the missing menu fix, includes COO, preserves recapture behavior, and adds current QA. Closure candidate only after this replacement ships. |
| [#44 consent](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/44) | Edits five historical root HTML files with a different tag. Production now publishes public through out and has the approved Google/HubSpot preference implementation. | Superseded implementation candidate; keep the separate Cloudflare telemetry decision visible. |
| [#42 smoke tooling](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/42) | Existing fleet smoke still installs playwright@latest. Pinning remains useful, but the comment claiming no repository Playwright dependency is stale: package.json pins 1.62.1. | Retain for focused rebase; use the repository pin and correct the comment. New migration QA uses the locked dependency already. |
| [#40 broad re-clone](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/40) | Proposes a different Next.js/runtime replacement, broad deletions, historical figures, policies, and domain assumptions. Current migration retains Elementor/BuddyX and already removed legacy dependencies by a different path. | Do not merge wholesale. Keep as historical comparison; separately verify any desired unique fix. |
| [#39 upload-artifact](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/39) | v4-to-v7 update still differs from current smoke workflow. | Retain for separately tested workflow upgrade. |
| [#31 ws](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/31) | Changes obsolete package-lock.json to 8.21.1. Active pnpm-lock.yaml already resolves ws 8.21.3. | Closure candidate as superseded; do not restore npm lockfile. |
| [#28 checkout](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/28) | v6-to-v7 upgrade remains unapplied. Older patch covers deploy only. | Retain for consistent, separately tested workflow upgrade. |
| [#26 minimatch](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/26) | Changes obsolete package-lock.json to 10.2.5. Active pnpm lock resolves 10.2.6. | Closure candidate as superseded. |
| [#24 upload-pages-artifact](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/24) | v4-to-v5 remains unapplied. Patch context still describes uploading the repository root. | Rebase carefully; preserve out-only publication and test with other Pages action upgrades. |
| [#23 jsdom](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/23) | 27.4.0-to-29.0.1 remains unapplied; proposal uses obsolete npm lockfile. DOM changes could affect capture and validation. | Recreate against pnpm, then test capture adapters, validation, and export. Separate dependency work. |
| [#22 glob](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/22) | 13.0.1-to-13.0.6 remains unapplied; proposal uses obsolete npm lockfile. | Recreate against pnpm and test validation scans/build. Separate dependency work. |
| [#21 configure-pages](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/21) | v4-to-v6 remains unapplied. | Retain for tested Pages action upgrade; production validation requires release approval. |
| [#20 deploy-pages](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/20) | v4-to-v5 remains unapplied. | Retain for tested Pages action upgrade. |
| [#19 incident notifications](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/19) | Fleet smoke already manages failure/recovery issues, but it runs after successful deployment or schedule/manual triggers. This PR adds immediate deploy-job failure notification, so it is not wholly redundant. It does not cover a failed build causing deploy to skip. | Retain for focused review of immediate deploy/build failure coverage and deduplication. Do not enable additional messaging implicitly. |
| [#17 AI config sync](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/17) | Introduces agent/config files and may replace migration-specific instructions. | Separate owner-reviewed tooling work; preserve current production guardrails. |
| [#10 sponsor docs](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/10) | Uses old root index.html and historical line numbers; content-management need remains valid. | Current maintenance.md replaces its workflow. Closure candidate after reviewed documentation ships. |
| [#8 pounds update](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/pull/8) | Proposes 8,371 in old root HTML; current approved capture displays 26,007. | Obsolete statistic; closure candidate. Maintenance guidance has been replaced without changing today's facts. |

Dependency comparisons are not a vulnerability certification. No dependency or deploy action version was changed in this cleanup.

## Issues

| Issue | Comparison and proposed disposition |
|---|---|
| [#45 Zeffy](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/issues/45) | Fleet provider preference, not a migration blocker. Existing Givebutter works as a destination. Keep pending a separate business decision; do not create a new payment provider. |
| [#43 consent](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/issues/43) | Root-publication and GTM assumptions are obsolete. Reconcile against current Google/HubSpot behavior, preserving the unresolved Cloudflare scope issue. Do not claim broader consent/legal compliance. |
| [#9 sponsor maintenance](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/issues/9) | Addressed by current maintenance instructions once reviewed and released. Closure candidate then. |
| [#7 8,371 pounds](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/issues/7) | Superseded by later captured totals; no rollback to the older number. Closure candidate. |
| [#3 UX backlog](https://github.com/FreeForCharity/FFC-EX-slopestohope.org/issues/3) | Gallery lightbox already exists; this cleanup adds descriptions and keyboard coverage. Hero redesign, partner grids, and team expansion remain separate content/design decisions. Keep and re-scope after owner review. |

## Approval boundary

This table is a proposed disposition, not authorization to close anything. Request explicit scope before closing PRs/issues or sending comments. Merge/deployment also requires Drew's approval. Re-check current state before acting because other maintainers may update these items.
