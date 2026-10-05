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

## October 5, 2026 approved destination refresh

Drew Roberts explicitly approved the following visitor-facing destination updates on October 5, 2026. The historical inventory remains unchanged; maintained substitutions are recorded in `tools/link-policy.mjs` so regeneration preserves the approved destinations.

| Partner / item | Prior destination | Approved / verified destination | Basis |
|---|---|---|---|
| Change the Trend | https://www.changethetrend.com/ and later https://changethetrend.org/ | https://www.facebook.com/CTTtricities/ | Drew explicitly approved the Facebook page as the replacement destination. |
| Summit Habitat for Humanity ReStore | http://summithabitat.org/restore/ | https://summithabitat.org/shop-the-restore/ | Current official Summit Habitat ReStore page verified October 5, 2026. |
| Assistance League of Denver | https://www.assistanceleague.org/denver/ | https://chapters.assistanceleague.org/chapter/denver/about-us/ | Current official Assistance League of Denver chapter page verified October 5, 2026. |
| The Salvation Army – Denver | http://intermountaineds.salvationarmy.org/ | https://www.salvationarmyusa.org/co/denver/ | Current official Salvation Army Denver location page verified October 5, 2026. |
| Community Ministry | http://www.comministry-denver.org/ | https://comministry-denver.org/ | Current organization site verified October 5, 2026. |
| BlueSky Breckenridge | http://www.blueskybreckenridge.com/ | https://blueskybreckenridge.com/ | Current official property site verified October 5, 2026. |
| Helly Hansen | http://hellyhansen.com/ | https://www.hellyhansen.com/en_us | Current Helly Hansen USA site verified October 5, 2026. |
| Springs Rescue Mission | http://www.springsrescuemission.org/ | https://springsrescuemission.org/ | Current official Springs Rescue Mission site verified October 5, 2026. |
| The Salvation Army Hope Center – Colorado Springs | http://coloradosprings.salvationarmy.org/ | https://www.salvationarmyusa.org/co/colorado-springs/ | Current official Salvation Army Colorado Springs location page verified October 5, 2026. |

The change also updates the visitor-facing Drew Roberts contact address from `drew@slopestohope.com` to `drew@slopestohope.org` on the Team, Privacy Policy, and Terms of Service pages, per Drew's explicit approval. No partner names, categories, page layout, analytics behavior, forms, donation providers, or other site functionality were changed.

