# Slopes to Hope migration checkpoint

This branch contains a static capture of the public `slopestohope.com` WordPress site taken at **2026-09-10T20:17:50Z**. The source site, Hostinger, DNS, Cloudflare, Google Workspace records, and the current `.org` to `.com` redirect were not changed.

## Captured site

- 37 sitemap-discovered public routes, including Home, Gallery, Team, Our Story, Partners, Contact, published utility pages, public taxonomy archives, and Elementor template URLs.
- 533 source assets mirrored from `wp-content` and `wp-includes`; the completed `public/` tree contains 586 files and is approximately 84 MB.
- Original navigation, wording, media, Elementor styling and interactions, HubSpot forms, Givebutter donation links, RallyUp pledge link, maps, analytics, social links, and accessibility widget integration.
- Canonical and Open Graph URLs target `slopestohope.org`. Site-owned asset and page requests are local, while intentional external services remain external.
- `/staff/` is retained as a compatibility redirect to the current `/team/` route.

The machine-readable source inventory is in `inventory.json`. It includes source hashes, page text, navigation, links, embeds, scripts, widget types, and mirrored asset hashes.

## Static-host adaptations

- LiteSpeed-delayed `src`, `srcset`, and `sizes` values are converted to native browser attributes.
- WordPress's PHP-only guest-cache probe, click-tracking POSTs, speculation rules, and duplicate lazy-loader runtime are removed.
- The original Elementor and BuddyX scripts are retained. Separate widget files are loaded after the combined bundle that provides jQuery.
- BuddyX mobile-menu open-state CSS omitted by LiteSpeed's used-CSS snapshot is restored from the original theme. The drawer is raised above Elementor's page-wide links, and its ARIA state follows its visible state.
- The deployment workflow validates the capture, creates `out/`, and publishes only `out/` when changes eventually reach `main`. A manual run on this migration branch cannot execute the deployment job.

## Verification completed

- Static validation: all 37 routes preserve captured titles and visible wording; all mapped internal links and local assets resolve; intentional external destinations match the capture; no `.com` asset/page runtime URLs remain.
- Full browser audit: 37 routes at 1440 px and 390 px had no missing local requests, `.com` runtime requests, JavaScript errors, or horizontal overflow. The initial Team portrait lazy-load finding was fixed and passed a focused browser regression at both widths.
- Interaction audit: desktop and mobile newsletter anchors and invalid-email handling, donation and pledge destinations, Gallery lightbox open/next/Escape behavior, Contact form fields and required-field validation, and mobile menu open/navigate/reopen/close behavior pass.
- Build: the validated static export contains the 37 captured routes, generated `robots.txt` and `sitemap.xml`, and the `/staff/` redirect.

No form, donation, CRM, analytics, or email write was sent during testing. HubSpot rendering and client-side validation are verified; end-to-end message delivery still requires an explicitly authorized controlled submission.

## Source-site findings preserved for review

- The live navigation currently exposes two destinations that return 404: `/open-positions/` and `/donations/slopes-to-hope`. They are recorded as known source defects rather than silently changed.
- The published FAQ contains legacy “Community Across America” content, and some old donation utility pages render inactive GiveWP shortcodes. They are preserved because this migration follows the current public site; changing them requires a separate content decision.
- The current newsletter form permits an empty email submission but rejects an invalid email format. This is HubSpot form configuration, not static-site behavior.
- The existing repository smoke test checks `.org`, follows its intentional redirect to WordPress, and fails because the current live site lacks the policy-footer links and cookie-consent UI expected by the Free For Charity fleet check. That failure does not test this branch's local build.
- Intentional third-party integrations remain network-dependent, including HubSpot, Givebutter, RallyUp, Google Maps/YouTube/analytics, Instagram, and Elementor's accessibility widget.
