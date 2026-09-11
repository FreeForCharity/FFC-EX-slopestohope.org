# Pre-launch audit

Completed on 2026-09-11 for `website-migration-2026-09`. No production system, domain routing, deployment setting, form, donation, email, CRM record, or analytics event was changed.

## Safe cleanup

- Excluded 21 unlinked, empty, or nonfunctional WordPress shells: 17 tag archives, one author archive, two ElementsKit internal-content routes, and `/volunteer/`. The retained Volunteer calls to action already use `/contact-us/`.
- Normalized each retained page's canonical and Open Graph URL to its absolute `https://slopestohope.org/` URL and removed WordPress shortlinks.
- Removed the Home page's deterministic 404 Instagram preview image and its now-empty image link. The reel link, attribution, blockquote, and Instagram embed remain.

## Published output

The initial audit contained eight migrated content routes plus the `/staff/` compatibility redirect to `/team/`. The release candidate later added `/privacy-policy/` and `/terms-of-service/` as published routes:

- `/`
- `/contact-us/`
- `/donors/`
- `/faq/`
- `/gallery/`
- `/our-story/`
- `/partners/`
- `/team/`
- `/privacy-policy/`
- `/terms-of-service/`

No broken internal links, Candid/GuideStar seal remnants, Community Across America remnants, GiveWP remnants, deleted policy shells, unintended policy files, or site-owned `.com` runtime dependencies remain in published output. The remaining `slopestohope.com` values are the retained Google Analytics linker configuration and Drew's visitor-facing email address.

The static migration did not technically depend on policy or consent routes. The release-candidate phase added site-specific Privacy Policy and Terms of Service pages plus real analytics consent to meet the repository's custom-domain smoke requirements and accurately describe the migrated site.

## Verification

- Static validation and production-equivalent build passed for all eight retained routes.
- Browser audit passed all eight routes at 1440 px and 390 px: zero missing local assets, `.com` runtime requests, external failures, JavaScript errors, horizontal overflow, or broken images.
- Donation and pledge destinations, Gallery open/advance/Escape behavior, and mobile menu navigation passed at desktop and mobile widths.
- The final HubSpot interaction rerun could not load external form frames because the local test browser reported `ERR_NETWORK_ACCESS_DENIED`. Earlier browser interaction reports passed both HubSpot forms and their client-side validation, and read-only endpoint probes returned HTTP 200 for the current portal scripts. No submission was attempted; end-to-end delivery remains a controlled live-verification item.
- Read-only availability checks returned HTTP 200 for Givebutter, RallyUp, Colorado Gives, the Instagram reel page, Facebook, Google Maps, all three HubSpot script endpoints, and the Google tag script. The Google tag resolves to `GT-MKTP8299` and measurement ID `G-XEWDW3TYVZ`.

The CNAME and deployment workflows were not changed. A merge to `main` would run the GitHub Pages workflow, validate and build the static migration, upload only `out/` (including `CNAME=slopestohope.org`), and deploy it to the configured Pages environment. The current Cloudflare `.org` to `.com` redirect remains outside this repository and would continue directing visitors to the live WordPress site until Drew separately approves cutover.
