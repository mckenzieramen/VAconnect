# VA CONNECT — Interactive Directory v2

**Brand:** VA CONNECT  
**Tagline:** Connect. Delegate. Elevate.

## What changed
- Rebranded the site completely from VA 100 to VA CONNECT.
- Added the VA CONNECT logo and favicon.
- Imported the **Global VA Agencies** spreadsheet into the website as a local directory dataset.
- Added a visual agency-card directory for all 118 entries.
- Added search by agency, role, region, scope, and eligibility text.
- Added filters for applicant scope, region, and application status.
- Added **Preview** modal with a live website iframe when the external site allows embedding.
- Added **Visit / Apply** buttons that open the source website in a new tab.
- Added application tracking statuses: Not Started, Saved, Applied, Interview, Offer, Rejected, Not Eligible.
- Added personal notes per opportunity.
- Progress is saved in browser localStorage so refreshing the page keeps the user's tracking data on that device/browser.
- Added dashboard counters for Applied, Interview, and Offer.
- Added mobile-responsive navigation and directory layout.

## Data source
The directory was imported from `Global VA Agencies.xlsx`, sheet `Global VA Directory`. Hyperlinks stored in the spreadsheet were preserved as the official website/career links.

## Important
External websites can block iframe previews with security headers. When that happens, the card's **Visit / Apply** button still opens the official website directly.

Application tracking is currently browser-local. A future Firebase/Firestore version can make the same tracking available across devices and accounts.

### V3 card visual update
- Restores and preserves the V1-style **Preview** button and modal website preview flow.
- Upgrades only the opportunity-card visual: premium VA/remote-work themed card backgrounds, browser-style website preview, agency-domain header, and supplied agency logo assets where available.
- Existing search, filters, tracking, notes, official Visit/Apply links, and modal behavior are preserved.
