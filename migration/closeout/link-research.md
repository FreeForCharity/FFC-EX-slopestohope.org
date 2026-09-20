# Partner-link research — September 20, 2026

Read-only GET audit of 65 distinct external destinations on the Partners page: 56 reachable responses, eight access-limited responses (403/429), and one HTTP 400. See [raw evidence](partner-links.json). A successful response alone does not establish every page's content; an access challenge does not establish a dead link.

## Verified local repairs

September 20 follow-up refreshed several destinations that were redirecting from plain HTTP and replaced the broken Change the Trend destination with the current Tri-Cities Homelessness page that explicitly documents the Change The Trend Network.

The two Hyatt links returned 429. Official equivalent destinations were found, matched to the same named resorts, and independently returned HTTP 200:

| Resort | Old destination | Verified replacement |
|---|---|---|
| The Residences at Main Street Station | https://www.hyatt.com/hyatt-vacation-club/en-US/bresh-the-residences-at-main-street-station | [Official resort page](https://www.hyattvacationclub.com/resorts/main-street-station) |
| Hyatt Vacation Club at The Ranahan | https://www.hyatt.com/hyatt-vacation-club/en-US/bresr-hyatt-vacation-club-at-the-ranahan | [Official resort page](https://www.hyattvacationclub.com/resorts/the-ranahan) |

Only href destinations changed. Link text, organization names, and layout are preserved. Explicit mappings in tools/link-policy.mjs preserve the historical inventory and survive regeneration.

## Resolved and retained destinations

- Change the Trend: the old https://www.changethetrend.com/ destination returned HTTP 400. The current Tri-Cities Homelessness “The Work” page explicitly identifies and describes the Change The Trend Network, so the Partners link now points to https://www.tricitieshomeless.com/about-the-work.
- Plain-HTTP partner links that had verified current HTTPS destinations were updated to those destinations: Colorado Springs Salvation Army, Springs Rescue Mission, Summit Habitat for Humanity ReStore, Intermountain Salvation Army Emergency Disaster Services, Community Ministry, Helly Hansen, and BlueSky Breckenridge.
- Beaver Run, Christ's Body, Marriott Mountain Valley Lodge, and Hotel Alpenrock/Hilton remain access-limited in automated checks. Preserve them as access-limited, not confirmed broken.
- WCRA and Bridges of Colorado, previously blocked in the September 18 audit, returned 200 in this pass. The [official Bridges page](https://bridges.colorado.gov/) confirms the agency identity. No replacement needed.
- Other destinations returned successful responses, including any followed redirects. Their exact statuses, final URLs, and page titles are in the JSON evidence.

No partner was contacted, no message was sent, and no payment or form was submitted. These replacement links are included in the September 20 approved release.
