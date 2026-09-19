# Partner-link research — September 19, 2026

Read-only GET audit of 65 distinct external destinations on the Partners page: 56 reachable responses, eight access-limited responses (403/429), and one HTTP 400. See [raw evidence](partner-links.json). A successful response alone does not establish every page's content; an access challenge does not establish a dead link.

## Verified local repairs

The two Hyatt links returned 429. Official equivalent destinations were found, matched to the same named resorts, and independently returned HTTP 200:

| Resort | Old destination | Verified replacement |
|---|---|---|
| The Residences at Main Street Station | https://www.hyatt.com/hyatt-vacation-club/en-US/bresh-the-residences-at-main-street-station | [Official resort page](https://www.hyattvacationclub.com/resorts/main-street-station) |
| Hyatt Vacation Club at The Ranahan | https://www.hyatt.com/hyatt-vacation-club/en-US/bresr-hyatt-vacation-club-at-the-ranahan | [Official resort page](https://www.hyattvacationclub.com/resorts/the-ranahan) |

Only href destinations changed. Link text, organization names, and layout are preserved. Explicit mappings in tools/link-policy.mjs preserve the historical inventory and survive regeneration.

## Unresolved or retained destinations

- Change the Trend: https://www.changethetrend.com/ returned 400 “Invalid URL.” The apex redirects to that same failing URL. The [City of Englewood](https://www.englewoodco.gov/government/city-departments/city-manager/elevate-englewood) identifies Change the Trend as a partner, and a [Littleton funding application](https://ompnetwork.s3-us-west-2.amazonaws.com/sites/199/documents/10-14-2025_cc_meeting_documents.pdf?RWc7CEc9CuLGIOBGYGoVmRzXXKgYil3b=) lists changethetrend.com. No verified alternative destination was established. Keep the link pending Drew's confirmation; do not silently remove the partner.
- Helly Hansen, Community Ministry, Beaver Run, Christ's Body, Marriott Mountain Valley Lodge, and Hotel Alpenrock/Hilton returned 403. Preserve them as access-limited, not confirmed broken. HTTPS alternatives for Helly Hansen and Community Ministry also returned 403, so no speculative replacement was made.
- WCRA and Bridges of Colorado, previously blocked in the September 18 audit, returned 200 in this pass. The [official Bridges page](https://bridges.colorado.gov/) confirms the agency identity. No replacement needed.
- Other destinations returned successful responses, including any followed redirects. Their exact statuses, final URLs, and page titles are in the JSON evidence.

No partner was contacted, no message was sent, and no payment or form was submitted. Replacement links are local changes awaiting an approved release.
