# Community Across America legacy audit

This audit covers the captured static site on `website-migration-2026-09`. Community Across America material is treated as migration residue, not as Slopes to Hope source content.

## Findings and disposition

### Actively required by the current presentation

- Eleven LiteSpeed used-CSS files contained `@font-face` URLs on `communityacrossamerica.com`. The font declarations are used by captured pages, but the legacy host is not required: all 22 unique font files already exist under `public/wp-content/uploads/elementor/google-fonts/fonts/`. The URLs now point to those local files.

### Visibly incorrect legacy content

- `/faq/` contained Community Across America questions, answers, Community Points copy, volunteer-program copy, and an embedded Community Across America presentation. The legacy sections and embed were removed. The page now directs Slopes to Hope questions to `/contact-us/` without inventing replacement program details.
- `/tag/community-across-america/` was an empty WordPress tag archive whose title and heading exposed the old name. It is excluded from validation, the generated sitemap, browser audits, and the published output.

### Harmless unused legacy material retained

- The repository's older top-level `our-story/index.html` and `wp-content/litespeed/ucss/8b1f027dc64668341437990e2eb28e91.css` contain a legacy link/font host. They are outside `public/`; the build deletes and recreates `out/` solely from `public/`, and the deployment workflow uploads only `out/`. They are retained as historical pre-migration files because deleting unrelated old repository content is unnecessary for visitor safety.
- `migration/inventory.json` and `migration/local-browser-audit.json` retain legacy text from the raw source capture. These files are audit evidence and are never copied into `out/`.

### Uncertain

- No Community Across America-specific analytics or tracking identifier was discoverable from names, domains, captured markup, or filenames. Existing third-party Slopes to Hope integrations remain unchanged because an identifier cannot be attributed to the predecessor site without account-side evidence.

## Published-output requirement

`tools/validate.mjs` scans generated HTML, CSS, JavaScript, and JSON for the legacy name, domain, common identifier variants, Community Points, and the removed presentation ID. Any recurrence fails the build.

## Verification

- Static validation passed for all 36 publishable routes and confirmed the legacy tag archive is excluded.
- The generated `out/` tree and sitemap contain no matching legacy names, URLs, identifiers, presentation ID, or tag route.
- Browser checks covered all 13 routes that use the rewritten stylesheets at 1440 px and 390 px. They found no legacy requests, missing local assets, JavaScript errors, horizontal overflow, or broken local images. Two unchanged homepage images supplied by GuideStar and Instagram were unavailable to the headless browser.
- A focused regression passed at both widths for the sanitized FAQ, its Contact link, local asset loading, legacy-domain blocking, and overflow. The mobile run also passed menu open, Partners visibility, and menu close behavior.
- The unchanged HubSpot newsletter and Contact frames were temporarily unavailable during the final external interaction retry. Their prior successful validation reports are retained; no HubSpot form or integration code changed in this cleanup.
