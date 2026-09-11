# Release-candidate audit

Prepared on 2026-09-11 on `website-migration-2026-09`. No merge, deployment, DNS change, CNAME change, GitHub Pages domain change, or domain cutover was performed.

## Policies and consent

- Added Slopes to Hope-specific `/privacy-policy/` and `/terms-of-service/` pages based on the integrations and behavior in the static migration. The unrelated Free For Charity policy markdown remains unpublished.
- Added Privacy Policy, Terms of Service, and Cookie settings controls to every published footer without redesigning the footer.
- Removed unconditional Google and HubSpot analytics loaders. On first visit, analytics storage defaults to denied and a native consent interface offers Accept analytics and Decline analytics.
- The choice persists in local storage and can be changed from the footer. Decline leaves normal site features available. Accept loads existing Google tag `GT-MKTP8299`, identifies measurement ID `G-XEWDW3TYVZ`, and enables the existing HubSpot tracking script. HubSpot form embeds remain available independently of the optional analytics choice.

## Verification

- Static validation and the production-equivalent build pass for ten published routes plus the `/staff/` redirect.
- Consent tests pass at 1440 px and 390 px for first visit, decline, persistence, settings reopening, accept, intended tag loading, policy navigation, revocation, post-revocation reload, and horizontal overflow.
- The full browser audit passes 20 route/viewport checks with zero missing assets, legacy requests, external failures, JavaScript errors, overflow, or broken images. Both HubSpot frames rendered at both widths.
- The interaction suite passes newsletter validation, contact-form validation, donation and pledge destinations, Gallery behavior, and mobile navigation. It blocks all writes.
- The unused external Elementor Ally widget, its action hook, and its exclusive CSS were removed. A static regression check prevents it from returning.
- No published Candid/GuideStar, Community Across America, GiveWP, Elementor Ally, deleted policy-shell, site-owned `.com` runtime dependency, broken internal link, or malformed local route remains.

## HubSpot end-to-end status

Both embedded forms loaded and returned HTTP 200 with no validation errors for the authorized test data; HubSpot's email check also returned success. In headless Edge, the newsletter reached Google's normal reCAPTCHA Enterprise token-generation request but remained in `Form is submitting`; the contact form also remained there. A visible automated Edge attempt closed before reCAPTCHA completed. No final HubSpot `/submissions/v3/` request occurred in any attempt, and a read-only CRM lookup after the attempts found zero contacts for the authorized test address. The two authorized submission allowances therefore remain unused. End-to-end submission requires one manual newsletter submission and one manual contact submission in a normal browser because reCAPTCHA did not complete in the automated browser. Details are recorded in `hubspot-end-to-end.json`.

## Retained `.com` references

- `drew@slopestohope.com` is the published organizational contact address and is used on Team and policy pages.
- `slopestohope.com` remains in the consented Google tag's cross-domain linker configuration while the live `.com` site remains active.

The ignored `.migration-cache/` contains only reproducible local screenshots and temporary diagnostics. Temporary HubSpot inspection and submission scripts are removed after use and are never published by the build.
