# Release-candidate audit

Prepared on 2026-09-11 on `website-migration-2026-09`. No merge, deployment, DNS change, CNAME change, GitHub Pages domain change, or domain cutover was performed.

## Policies and consent

- Added Slopes to Hope-specific `/privacy-policy/` and `/terms-of-service/` pages based on the integrations and behavior in the static migration. The unrelated Free For Charity policy markdown remains unpublished.
- Added Privacy Policy, Terms of Service, and Cookie settings controls to every published footer without redesigning the footer.
- Removed unconditional Google and HubSpot analytics loaders. On first visit, analytics storage defaults to denied and a native consent interface offers Accept analytics and Decline analytics.
- The choice persists in local storage and can be changed from the footer. Decline leaves normal site features available. Accept loads existing Google tag `GT-MKTP8299`, identifies measurement ID `G-XEWDW3TYVZ`, and enables the existing HubSpot tracking script. HubSpot form embeds remain available independently of the optional analytics choice.

## Verification

- Static validation and the production-equivalent build pass for ten published routes plus the `/staff/` redirect.
- Consent tests pass at 1440 px and 390 px for first visit, decline, persistence, settings reopening, accept, intended tag loading, policy navigation, and horizontal overflow.
- The full browser audit passes 20 route/viewport checks with zero missing assets, legacy requests, external failures, JavaScript errors, overflow, or broken images. Both HubSpot frames rendered at both widths.
- The interaction suite passes newsletter validation, contact-form validation, donation and pledge destinations, Gallery behavior, and mobile navigation. It blocks all writes.
- No published Candid/GuideStar, Community Across America, GiveWP, deleted policy-shell, site-owned `.com` runtime dependency, broken internal link, or malformed local route remains.

## HubSpot end-to-end status

The test schemas were inspected read-only and both forms loaded. The authorized real submissions were not sent because automatic approval review required a direct chat authorization after noting that the actions can create HubSpot CRM records, subscriptions, notifications, or email activity. No submission allowance was consumed. After direct authorization, run exactly one newsletter submission and one contact-form submission, record their HTTP and confirmation results, rerun final validation, and update this report.

## Retained `.com` references

- `drew@slopestohope.com` is the published organizational contact address and is used on Team and policy pages.
- `slopestohope.com` remains in the consented Google tag's cross-domain linker configuration while the live `.com` site remains active.

The ignored `.migration-cache/` contains only reproducible local screenshots and temporary diagnostics. Temporary HubSpot inspection and submission scripts are removed after use and are never published by the build.
