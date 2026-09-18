# Slopes to Hope migration checkpoint

This branch contains a static capture of the public `slopestohope.com` WordPress site taken at **2026-09-10T20:17:50Z**. The source site, Hostinger, DNS, Cloudflare, Google Workspace records, and the current `.org` to `.com` redirect were not changed.

## Captured site

- 37 sitemap-discovered public routes, including Home, Gallery, Team, Our Story, Partners, Contact, published utility pages, public taxonomy archives, and Elementor template URLs.
- 533 source assets mirrored from `wp-content` and `wp-includes`; the completed `public/` tree contains 586 files and is approximately 84 MB.
- Original navigation, wording, media, Elementor styling and interactions, HubSpot forms, Givebutter donation links, RallyUp pledge link, maps, analytics, and social links.
- Canonical and Open Graph URLs target `slopestohope.org`. Site-owned asset and page requests are local, while intentional external services remain external.
- Slopes to Hope-specific Privacy Policy and Terms of Service pages, footer links, and native analytics consent are added for the static release candidate.
- `/staff/` is retained as a compatibility redirect to the current `/team/` route.

The machine-readable source inventory is in `inventory.json`. It includes source hashes, page text, navigation, links, embeds, scripts, widget types, and mirrored asset hashes.

## Static-host adaptations

- LiteSpeed-delayed `src`, `srcset`, and `sizes` values are converted to native browser attributes.
- WordPress's PHP-only guest-cache probe, click-tracking POSTs, speculation rules, and duplicate lazy-loader runtime are removed.
- The original Elementor and BuddyX scripts are retained. Separate widget files are loaded after the combined bundle that provides jQuery.
- BuddyX mobile-menu open-state CSS omitted by LiteSpeed's used-CSS snapshot is restored from the original theme. The drawer is raised above Elementor's page-wide links, and its ARIA state follows its visible state.
- The deployment workflow validates the capture, creates `out/`, and publishes only `out/` when changes eventually reach `main`. A manual run on this migration branch cannot execute the deployment job.

> Homepage recapture safeguard: the migration capture command refuses to overwrite the current owner-approved homepage hero/Candid visual adaptations unless `--allow-homepage-recapture` is supplied after those adaptations have been explicitly reconciled. This prevents a future source capture from silently removing the reviewed homepage behavior.\n\n## Verification completed

- Static validation: all ten published routes pass; retained source wording is preserved except for the explicitly approved homepage display adaptations, all mapped internal links and local assets resolve, intentional external destinations match the capture, and no `.com` asset/page runtime URLs remain.
- Full browser audit: the current ten published routes pass at 1440 px and 390 px with no missing assets, legacy requests, external failures, JavaScript errors, overflow, or broken images. The Newsletter and Contact HubSpot form frames render at both widths.
- Interaction audit: reduced-motion hero behavior, desktop and mobile newsletter anchors and invalid-email handling, donation and pledge destinations, Gallery lightbox open/next/Escape behavior, Contact form fields and required-field validation, and mobile menu open/navigate/reopen/close behavior pass.
- Build: the validated static export contains ten published routes, generated `robots.txt` and `sitemap.xml`, and the `/staff/` redirect. Empty tag and author archives, two empty ElementsKit internal-content routes, the empty Volunteer shell, Community Across America tag archives, four retired GiveWP workflow pages, and the approved title-only policy shells are excluded.
- Consent validation: a first visit enables Google Analytics and HubSpot analytics without showing a modal; Cookie settings can be dismissed with Escape; a saved decline prevents those analytics loaders on later visits; footer Cookie settings can turn analytics off or back on; Google tag `GT-MKTP8299` and measurement ID `G-XEWDW3TYVZ` are preserved; Google advertising consent remains denied.

No new form, donation, CRM, or email write was sent during the current automated QA. Earlier one-time authorized Newsletter and Contact submissions on 2026-09-11 verified end-to-end HubSpot delivery, as recorded in `hubspot-end-to-end.json`; those one-time submission allowances are consumed.

## Source-site findings preserved for review

- The source capture contained links to two WordPress destinations that returned 404: `/open-positions/` and `/donations/slopes-to-hope`. Neither remains in the published static build; the orphaned archive pages containing `/open-positions/` are excluded, and the Donors call to action uses Givebutter.
- Community Across America remnants were classified and sanitized under the later-approved legacy cleanup. See `migration/community-across-america-audit.md`.
- GiveWP was retired by owner decision. Its orphaned workflow pages and shortcode output were removed, and the broken Donors call to action now uses Givebutter. See `migration/givewp-audit.md`.
- Unlinked WordPress archive/template shells were excluded from the static site: 17 empty tag archives, the empty Drew Roberts author archive, two empty ElementsKit internal-content routes, and the empty `/volunteer/` page. The visible Volunteer calls to action already use `/contact-us/`.
- The current newsletter form permits an empty email submission but rejects an invalid email format. This is HubSpot form configuration, not static-site behavior.
- The release candidate provides the policy-footer links and a persistent Cookie settings control. The repository smoke workflow accepts either a first-load consent interface or this visible footer control. The current live `.org` redirect still targets WordPress, so the scheduled production check does not yet exercise this branch.
- Intentional third-party integrations remain network-dependent, including HubSpot, Givebutter, RallyUp, Google Maps/YouTube/analytics, and Instagram.
- The final local browser audit passes all ten published routes at 1440 px and 390 px with no missing assets, legacy requests, external failures, JavaScript errors, overflow, or broken images. Both HubSpot form frames render at both widths, and the final interaction rerun passes reduced-motion behavior, form validation, donation destinations, Gallery behavior, and mobile navigation.
