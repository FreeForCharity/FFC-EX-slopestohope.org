# GiveWP cleanup

GiveWP is retired for the Slopes to Hope migration. The current donation destinations are Givebutter, RallyUp, and Colorado Gives.

## Removed from visitor-facing output

- `/donation-confirmation/`: orphaned GiveWP receipt page containing `[give_receipt]`.
- `/donation-failed/`: orphaned GiveWP failure page.
- `/donor-dashboard/`: orphaned, empty GiveWP donor dashboard.
- `/test-donate/`: orphaned test page containing `[give_form id=”11381″]`.
- The broken `/donations/slopes-to-hope` link on `/donors/` now uses the established `https://givebutter.com/slopes-to-hope` destination.

The four removed routes had no inbound links from another captured page. No GiveWP plugin scripts, styles, or assets were present under `public/`, so no shared runtime files were removed.

## Intentionally retained

- `migration/inventory.json` and `migration/local-browser-audit.json` retain the original shortcode text as source-capture evidence. They are not published.
- Older repository-root HTML files contain GiveWP CSS variables and selectors. They are outside `public/`, are not copied into `out/`, and are retained because deleting unrelated historical files is unnecessary for this focused cleanup.

## Policy content awaiting an owner decision

No policy content was changed.

- `/privacy-policy-2/` is a published title-only shell with no policy body.
- `/terms-of-service-2/` is a published title-only shell with no terms body.
- `privacy-policy.md` and `cookie-policy.md` contain Free For Charity template language, including Free For Charity identity, data practices, and URLs; they are not published by this build.
- `terms-of-service.md` contains only Free For Charity front matter and no terms body; it is not published by this build.
- `free-for-charity-donation-policy.md` is a Free For Charity donation-acceptance policy covering cash, securities, real estate, personal property, in-kind contributions, acknowledgments, confidentiality, and board review. It is not a Slopes to Hope policy and is not published by this build.
- No refund or chargeback language was found in the captured visitor-facing site or these repository policy files.

Publishing, adapting, or replacing any of this policy material requires Drew's approval of the substantive language.

## Verification

- Static validation and the production build passed for 31 publishable routes.
- Scans of `public/`, `out/`, and the generated sitemap found no GiveWP names, shortcodes, retired route references, or the broken legacy donation URL.
- Focused browser checks passed at 1440 px and 390 px. The Donors button uses Givebutter, the Home Givebutter and RallyUp links remain present, the Partners Colorado Gives link remains present, and no local request or JavaScript error occurred.
- Each retired GiveWP route returns 404 from the generated build.
