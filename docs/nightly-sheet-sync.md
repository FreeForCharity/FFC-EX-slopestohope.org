# Nightly collection sync

Drew authorized completion of this narrow project on October 26, 2026, in
STH-WEBSITE-SYNC-COMPLETE-20261026-08, including cloud resources, credential
configuration, PR pushes, protected merging, deployment, and nightly activation.
This supersedes PR #111's previous manual-only and draft-only design. It does
not authorize source-sheet edits, policy changes, unrelated site edits, or
automatic dismissal or resolution of substantive review findings.

## Verified, and remaining

The PR111 keyless pilot and Migration QA passed:
https://github.com/FreeForCharity/FFC-EX-slopestohope.org/actions/runs/40421916609
https://github.com/FreeForCharity/FFC-EX-slopestohope.org/actions/runs/40421916452

The service account has Viewer permission on exactly the two authorized source
spreadsheets, no project roles, and no user-managed keys. Separate Google
providers restrict trust to PR111's exact workflow/ref or nightly-pounds.yml on
main with schedule/workflow_dispatch. The main provider has been created and
read back, but its cloud authentication has not yet been executed.

Production is gated by STH_SYNC_ACTIVE, which must remain unset until the full
manual publishing pilot succeeds. The temporary STH_SYNC_GH_PILOT_TOKEN is not
referenced by the production workflow and must never be copied into its secret.

## Authentication

Prefer a dedicated GitHub App installed only on this repository. Repository
permissions: Contents write, Pull requests write, Actions read, and Checks read;
Metadata read is implicit. No organization or Administration permission and no
bypass actor. Configure STH_SYNC_GH_APP_ID and STH_SYNC_GH_APP_PRIVATE_KEY as
repository secrets. Installation tokens are repository-restricted, refreshed
before the queue/deployment wait, and revoked at job completion. Installation
requires a repository administrator or organization owner for Drew's current
outside-collaborator role.

Alternative: an expiring classic PAT belonging to drewrobertssth with exactly
public_repo, stored as STH_SYNC_GH_TOKEN. Fine-grained PATs do not currently
support this outside-collaborator scenario. A classic PAT covers the user's
accessible public repositories, so it is less narrowly scoped and requires
rotation before expiration. Use an explicit finite lifetime; do not reuse the
temporary pilot token or create a non-expiring token. This alternative requires
interactive secure input and is not configured by this PR.

GITHUB_TOKEN remains restricted to reads in the producer and Issues write in
the incident job. PRs generated with GITHUB_TOKEN need manual workflow approval,
and its pushes do not trigger Pages; it cannot satisfy this unattended design.
See GitHub's GITHUB_TOKEN documentation for the event restrictions.

## Source and change limits

Read FY27 A1:B5 and G7:H1000 from the inventory sheet, plus FY27 A1:B1 from the
fundraising sheet, with spreadsheets.readonly scope. Read G:H as values and
formulas. Independently sum numeric H entries from row 7 through the established
separator; reject nonnumeric, negative, nonfinite, missing, or inconsistent data.
Verify the source Overall formula adds 20855.4 to the matching FY27 summary.

Round pound labels using Math.round; show progress at two decimals against
20,000. Change only three numerical homepage fields and the corresponding two
migration baseline strings. Compare the entire prepared files to these exact
edits. Fundraising must be valid numeric source data with the expected label;
valid differences from either existing website label create a separate warning
and never modify fundraising or prevent valid poundage updates.

## Release and verification

1. Serialize runs. Check out main, read current sources, and refuse a duplicate
   pending sync PR across all pages and known automation branch conventions.
2. On no change, verify the published figures and create no branch/commit/PR.
3. On change, commit only approved numerical edits and open a ready PR using the
   separate production credential so normal QA and Copilot events run.
4. Require current-head Copilot review without findings, no unresolved threads,
   no outstanding changes requested, successful Migration QA/security audit,
   and successful remaining check runs/statuses. Ambiguous reviews block safely.
   Never resolve threads, dismiss reviews, approve as a bot, or use --admin.
5. Refresh Google access, reread/reconcile sources, and reject a stale proposal.
   Enter the existing merge queue with a matching expected head. On failure or
   timeout, attempt to disable auto-merge/dequeue and report failure. Pending
   proposals remain for review and block duplicate nightly proposals.
6. Migration QA and Security Audit run on merge_group. GitHub enforces all
   repository and organization rules; this workflow adds no bypass.
7. Verify the successful Pages deployment for the exact merged SHA, then compare
   actual live homepage labels/progress against that deployed revision. Retry
   briefly for CDN propagation. Pages also performs this check after each main
   deployment; its existing incident job reports failures.

Failures create/update a marked repository issue using the independent built-in
token. Fundraising warnings use a separate incident. GitHub notification delivery
depends on the user's repository/Actions notification preferences and must be
checked during activation; no email delivery is claimed by local tests.

## Activation and schedule

First finish all current-head CI/reviews and credential setup. Merge PR111 only
through the queue. Run nightly-pounds.yml manually on main, verify real production
OIDC, generated PR review/QA/queue, Pages, and the displayed figures. Repeat to
prove no-change behavior. Only then set repository variable STH_SYNC_ACTIVE=true.

Schedule: 59 23 * * * with timezone America/Denver. GitHub supports IANA timezone
schedules and adjusts DST. 23:59 avoids the repeated/skipped transition hour.
GitHub-hosted schedules can be delayed or dropped under load and public-repo
schedules may be disabled after inactivity; retain independent health/freshness
monitoring. Do not promise an exact-minute execution SLA.

After replacement is operational, revoke the temporary PAT and delete its pilot
secret. Retire only competing GitHub writes in Website Sync & Health, preserving
its monitoring. Keep historical audit records. These cleanup steps are not yet
complete.

## Rollback

Unset STH_SYNC_ACTIVE to stop scheduled publishing while preserving monitoring.
Disable auto-merge/dequeue any pending numerical PR before troubleshooting.
Revert a faulty implementation through a reviewed PR and the existing queue.
No source-sheet, DNS, routing, analytics, consent, or integration changes are
part of this implementation. A live verification failure alerts after deployment;
it cannot make a distributed Pages deployment transactional or undo invalid data
after the fact. Source and site validation are therefore required before merge.
