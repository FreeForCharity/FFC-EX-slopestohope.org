# Current migration runbook

Updated September 19, 2026. This supersedes the [September 11 checkpoint](history/september-11-checkpoint.md). The September 18 audit recorded .org serving the static release independently of .com; initial cutover was complete. Verify current routing before future production work.

## Architecture

`public/` is the maintained source tree. `tools/validate.mjs` checks captured wording, links, assets, legacy-residue exclusions, metadata, exact HubSpot embeds, consent wiring, and accessibility invariants. `tools/build.mjs` copies public to out and generates sitemap.xml and robots.txt. Pages publishes only out.

The 11 pages are Home, Contact Us, Our Story, FAQ, Donors, Team, Gallery, Partners, COO Summit 2026, Privacy Policy, and Terms of Service. /staff/ uses an HTML browser redirect, not a server-side 301. Retired archives, GiveWP pages, policy shells, and the empty Volunteer page remain excluded.

Original Elementor/BuddyX runtimes and mirrored media preserve presentation. Approved .org changes include the hero, Candid integration, Partners and FAQ cleanup, policies, analytics behavior, exact form embeds, and COO page. Blind recapture of .com can overwrite these changes.

## Integrations

| Integration | Configuration |
|---|---|
| Newsletter | HubSpot `9a181260-20a9-408c-8591-cca3093d7e3f` |
| Contact | HubSpot `f35f941a-7978-41cc-aabc-4dc669ac9a0a` |
| COO Summit | HubSpot `05a4b6fe-6b23-433e-bf08-e667071c8d3b` |
| Portal | `244348981`, region `na2`, exact adjacent loader/frame snippet |
| Measurement | Google tag `GT-MKTP8299`, GA4 `G-XEWDW3TYVZ` |
| Preferences | Google/HubSpot analytics enabled by default; footer settings permit decline/re-enable; advertising consent denied |
| Giving | Givebutter, RallyUp, and Colorado Gives |
| Other content | Captured maps, social links, Instagram, and other third-party embeds |

Cloudflare performance telemetry was observed independently of the saved preference. Its behavior and matching wording await Drew's decision. This documents implementation, not legal compliance.

## Maintenance and evidence

Follow [maintenance](maintenance.md), [deployment](../DEPLOYMENT.md), and [rollback](rollback-runbook.md). Preserve unresolved facts, recipient settings, and provider choices. Intentional .com email addresses are not asset dependencies.

`tools/release-policy.mjs` reapplies exact embeds, consent/footer markup, accessibility adaptations, and verified link repairs; it also generates the two policies. Gallery descriptions are in `migration/gallery-descriptions.json`. Explicit link exceptions are in `tools/link-policy.mjs`, preserving historical inventory URLs.

`pnpm run capture` is an import/recovery tool, not publishing. Run it only in a disposable branch, reviewing the complete diff. Do not bypass the homepage recapture guard as routine maintenance.

See [current verification](closeout/README.md) and [owner decisions](owner-decisions.md). Older reports describe their own route counts and consent behavior. Render tests do not prove CRM storage, inbox delivery, payment completion, indexing, or private backup restorability.
