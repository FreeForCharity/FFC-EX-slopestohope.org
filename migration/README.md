# Current migration runbook

Updated September 20, 2026. This supersedes the [September 11 checkpoint](history/september-11-checkpoint.md). The September 18 audit recorded .org serving the static release independently of .com; initial cutover was complete. Verify current routing before future production work.

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
| Preferences | Google/HubSpot analytics are enabled by default where prior consent is not required. EEA/UK and covered EU outermost-region visitors receive a prior-consent prompt and analytics remains off until accepted. A failed region lookup also fails closed to the prompt. Footer settings permit decline/re-enable everywhere; advertising consent remains denied. |
| Giving | Givebutter and RallyUp are the approved website fundraising providers. Do not add another provider without Drew's explicit approval. |
| Other content | Captured maps, social links, Instagram, and other third-party embeds |

Owner decision September 20, 2026: analytics should run by default where prior consent is not required, while visitors in regions requiring prior consent must see the prompt before optional analytics starts. Declining analytics must suppress optional client-side analytics and performance telemetry, including Cloudflare RUM. The site uses Cloudflare's same-origin `/cdn-cgi/trace` country code for the regional gate, fails closed to the consent prompt if region lookup fails, blocks Cloudflare RUM while consent is absent/denied in a prior-consent region, and stores explicit choices in the first-party `sth_analytics` cookie. The remaining Cloudflare account rule is: Configuration Rule expression `http.cookie contains "sth_analytics=denied"`, with **Disable Real User Monitoring (RUM)** enabled (`disable_rum=true`). This prevents Cloudflare from injecting RUM on later requests carrying the declined preference. This documents implementation, not legal compliance.

## Maintenance and evidence

Follow [maintenance](maintenance.md), [deployment](../DEPLOYMENT.md), and [rollback](rollback-runbook.md). Preserve unresolved facts, recipient settings, and provider choices. Intentional .com email addresses are not asset dependencies.

`tools/release-policy.mjs` reapplies exact embeds, consent/footer markup, accessibility adaptations, and verified link repairs; it also generates the two policies. Gallery descriptions are in `migration/gallery-descriptions.json`. Explicit link exceptions are in `tools/link-policy.mjs`, preserving historical inventory URLs.

`pnpm run capture` is an import/recovery tool, not publishing. Run it only in a disposable branch, reviewing the complete diff. Do not bypass the homepage recapture guard as routine maintenance.

Current homepage collection totals were rechecked September 19 against the authoritative Google Drive `Storage Unit - Inventory`: FY27 total `5,151.7` pounds is displayed as `5,152`, and overall `26,007.1` pounds is displayed as `26,007`. Drew confirmed the current website numbers are correct.

See [current verification](closeout/README.md) and [owner decisions](owner-decisions.md). Older reports describe their own route counts and consent behavior. Render tests do not prove CRM storage, inbox delivery, payment completion, indexing, or private backup restorability.
