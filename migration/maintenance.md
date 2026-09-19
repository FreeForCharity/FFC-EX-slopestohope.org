# Maintaining website content

The content owner is not yet assigned. Drew supplies or approves organizational facts; a maintainer prepares branch changes, tests them, and requests release approval.

## Repeatable editing process

1. Start a working branch from current main. Edit files under public, never root HTML or generated out.
2. Locate text by its wording using an editor's search. Avoid historic line numbers: WordPress exports contain long lines.
3. Make the smallest content change, preserving Elementor classes, data attributes, surrounding layout, Oxford commas, and integration snippets.
4. For approved visible-wording changes, update only the corresponding route's `bodyText` in migration/inventory.json to the approved new wording. Retain source hashes and capture dates as historical evidence. Record the approval, old value, new value, and effective date in the PR. Never replace the entire baseline merely to make validation pass.
5. Run build and the relevant browser suites; review desktop and mobile previews.
6. Request explicit merge/deployment approval. Record the deployed revision after release.

## Where to edit

| Content | Maintained source | Required checks |
|---|---|---|
| Current totals and goals | public/index.html | Search displayed numbers, counter data-to-value attributes, progress-bar values, and percentages; confirm units, dates, denominators, and rounding with Drew |
| Historical narrative | public/our-story/index.html | Do not replace historical totals when updating today's totals |
| Partners, recipients, resorts, and sponsors | public/partners/index.html; check Home and Donors for repeated entries | Correct organization, working official URL, approved category, and mobile layout |
| Founding donors and recognition | public/donors/index.html | Approved dates and promises; do not extend an expired offer automatically |
| Team | public/team/index.html | Approved names, roles, biography, portrait, and contact address |
| Gallery | public/gallery/index.html and local public/wp-content/uploads assets | Preserve thumbnail/full-image pairing, srcset, lightbox grouping, and sequence |
| Gallery descriptions | migration/gallery-descriptions.json, keyed by full-image href | Describe observed content without guessing identities; run release-policy.mjs to reapply |
| Contact/COO | public/contact-us/index.html; public/coosummit26/index.html | Preserve exact HubSpot loader/frame, region, portal, and form IDs |
| Policies | tools/release-policy.mjs | Policy-language changes need substantive approval; regenerate and review both public policy pages |
| Verified partner-link substitutions | tools/link-policy.mjs | Record official identity evidence in closeout/link-research.md; preserve captured inventory links |

For a partner entry, copy the adjacent entry in the same section and change only approved name/link text. Preserve its existing formatting. Add the same approved wording to the inventory baseline. Escape ampersands as &amp; in HTML. Do not publish a guessed URL or change a partner's relationship category.

Gallery additions need descriptive alt text and a link label such as “Open photo: …”. Add a matching description entry using the full-size local image path, then run `node tools/release-policy.mjs`. Decorative header images may retain empty alt.

## Integration boundaries

Form fields, required settings, CRM mappings, notification recipients, subscriptions, and workflows live in HubSpot. An HTML edit cannot repair those settings. Donation links use the existing approved providers; changing providers is a business decision.

Google/HubSpot preferences are implemented in public/assets/consent.js and consent.css. Cloudflare telemetry is a separate unresolved setting. Do not change either policy or behavior incidentally during content edits.

## Commands and evidence

```sh
pnpm run build
node --test tools/request-audit.test.mjs
pnpm run test:browser
pnpm run test:interactions
pnpm run test:consent
```

Set SITE_ROOT=out. Screenshots are under .migration-cache/screenshots; JSON evidence is under migration. Do not treat a failed third-party request as a content fact or silently remove a partner because its website blocks automated access.

The maintenance record should contain the owner, approval reference, content effective date, changed pages, tested commit, test results, approved release, and rollback SHA. Actual owner names and update cadence remain to be assigned.
