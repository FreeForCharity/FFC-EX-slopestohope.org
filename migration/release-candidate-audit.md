# Release-candidate audit

Prepared on 2026-09-11 on `website-migration-2026-09`. No merge, deployment, DNS change, CNAME change, GitHub Pages domain change, or domain cutover was performed.

## Policies and consent

- Added Slopes to Hope-specific `/privacy-policy/` and `/terms-of-service/` pages based on the integrations and behavior in the static migration. The unrelated Free For Charity policy markdown remains unpublished.
- Added Privacy Policy, Terms of Service, and Cookie settings controls to every published footer without redesigning the footer.
- Removed legacy unconditional Google and HubSpot analytics loaders. The site now uses the controlled analytics loader in `/assets/consent.js`: on first visit Google Analytics and HubSpot analytics are enabled by default without a modal, while advertising-related consent remains denied.
- A visitor who uses the footer Cookie settings control can decline analytics; that saved decline is reapplied on later visits and prevents the Google and HubSpot analytics loaders. The same control can re-enable analytics later. Google tag `GT-MKTP8299`, measurement ID `G-XEWDW3TYVZ`, and the existing HubSpot analytics integration are preserved. HubSpot form embeds remain available independently of the analytics setting.

## Verification

- Static validation and the production-equivalent build pass for ten published routes plus the `/staff/` redirect.
- Consent tests cover 1440 px and 390 px behavior for default-on analytics without a modal, decline, persistence, settings reopening, re-enable, intended tag loading, policy navigation, revocation, post-revocation reload, and horizontal overflow.
- The full browser audit passes 20 route/viewport checks with zero missing assets, legacy requests, external failures, JavaScript errors, overflow, or broken images. Both HubSpot frames rendered at both widths.
- The interaction suite passes newsletter validation, contact-form validation, donation and pledge destinations, Gallery behavior, and mobile navigation. It blocks all writes.
- The unused external Elementor Ally widget, its action hook, and its exclusive CSS were removed. A static regression check prevents it from returning.
- The broken legacy Candid/GuideStar seal embed is removed; the homepage now uses the locally hosted Candid Platinum Transparency 2026 badge linking to the Slopes to Hope Candid profile. No Community Across America, GiveWP, Elementor Ally, deleted policy-shell, site-owned `.com` runtime dependency, broken internal link, or malformed local route remains.

## HubSpot end-to-end status

Both embedded forms completed end to end through the normal Chrome browser using the one-time authorized test data. The Newsletter form displayed its subscription success message and created the expected HubSpot contact at `2026-09-11T19:29:16.315Z`. The Contact Us form displayed its submission success message and updated the same contact; HubSpot recorded the authorized message and referral value, two total form submissions, and two unique forms. A read-only CRM verification confirmed the timestamps, conversion names, counts, and submitted values. Personally identifying test values and the internal CRM identifier are redacted from the release artifacts. Both one-time submission allowances are consumed, and neither form may be submitted again during this verification cycle.

Earlier automated Edge attempts remain relevant historical context: HubSpot field and email validation returned HTTP 200, but reCAPTCHA did not complete and no automated final submission request occurred. The successful manual Chrome tests resolved that automation-only limitation. Details are recorded in `hubspot-end-to-end.json`.

## Retained `.com` references

- `drew@slopestohope.com` is the published organizational contact address and is used on Team and policy pages.
- The remotely rendered HubSpot contact form supplies `support@slopestohope.com` as its organizational contact link; it is not a static-site dependency.
- `slopestohope.com` remains in the consented Google tag's cross-domain linker configuration while the live `.com` site remains active.

The ignored `.migration-cache/` contains only reproducible local screenshots and temporary diagnostics. Temporary HubSpot inspection and submission scripts are removed after use and are never published by the build.
