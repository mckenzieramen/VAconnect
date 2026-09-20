# VA CONNECT — Reference Fidelity v11

This build uses the supplied VA CONNECT visual reference as the desktop source of truth and preserves the existing 118-agency data model.

## Included
- Premium dark navy/cyan/purple reference-style layout
- Sticky header with VA CONNECT branding and navigation
- Hero with promotional remote-work visual and four dynamic statistics
- Search, region, role, status and sort controls
- Dynamic 118-opportunity rendering
- Three-column desktop / two-column tablet / one-column mobile
- Browser-style domain bars, numbered badges, favorite buttons
- Promotional company banners for the first six reference agencies using supplied/reference assets
- Preview modal with real external website iframe attempt
- Graceful fallback when an agency blocks iframe embedding (no ugly “refused to connect” screen)
- Visit / Apply external link and application-status tracking
- Favorites and personal notes persisted in localStorage
- Responsive/mobile navigation and iPhone Safari input sizing
- Existing `agencies.js` data preserved

## Verification
- JavaScript syntax: PASS
- Local asset reference check: PASS
- 118 opportunity records detected: PASS
- ZIP integrity: checked after packaging


OFFICIAL LOGO REPLACEMENT — 2026-09-20
---------------------------------------
All previously bundled agency logo assets and the six old image banners containing embedded agency branding were removed.
No replacement logo was fabricated.

The file `official-logo-sources.json` contains the 118 agency records and their official websites.
Only verified logo files downloaded from those official sites/official brand-asset pages should be placed in:
`assets/logos/AgencyName_logo.ext`

The application will use a verified local logo only when it is explicitly mapped in `logoMap`.
It will never silently use an old asset, a third-party logo service, a generated logo, or a favicon as an agency logo.


## V15 — Reference UI Fidelity Revision (2026-09-20)
- Applied the supplied VA CONNECT reference layout to the opportunity directory.
- Removed legacy agency-logo assets from the package; only the official-logo source manifest remains.
- Opportunity cards now use a consistent screenshot-style structure: promotional banner, number badge, dynamic status badge, company row, favorite control, metadata, tags, Preview, and Visit / Apply.
- Preserved the data-driven 118-agency architecture, search/filter/sort, status tracking, favorites, preview modal, and external application URLs.
- Added dynamic navigation active-pill behavior based on the visible section.

### V16 tracking revision
- Added a fully visible Track Applications workspace linked to the header navigation.
- Shows Total Tracked, Saved, Applied, Interview, and Offers counts.
- Shows tracked opportunities with current stage, notes, View, and Apply actions.
- Tracker updates immediately when status/favorite/note changes are saved.
- Existing 118 opportunity data and directory functionality preserved.


## V17 — Personal Tracker, Email Profile & Dedicated Pages
- Track Applications now has a dedicated `tracker.html` workspace instead of only an in-page strip.
- Tracker is organized into Total Tracked, Saved, Applied, Interview and Offer stages.
- Favorites and status changes are included in the tracked pipeline.
- Email profile sign-in is added so tracker data is keyed by the user's email on the device.
- Added dedicated Discover, About and Resources pages.
- About now states the platform objective: turn a scattered VA job search into an organized application journey.
- Discover explains Explore → Compare → Save & Track → Keep Applying.
- Added the 8:00 AM Asia/Manila reminder UX.

### Morning email automation
A Firebase/Cloud Functions backend scaffold is included under `functions/`. It uses a scheduled function at `0 8 * * *` with timezone `Asia/Manila` and Resend for email delivery. This is intentionally not presented as live until the VA CONNECT Firebase project and Resend sender/API secret are connected. The static Cloudflare Pages frontend alone cannot securely send scheduled emails to users or persist their tracker across devices.

Firebase Authentication can provide verified email/password or passwordless email-link sign-in; the current V17 frontend keeps a lightweight email-profile fallback so the UI remains usable before backend credentials are connected.

### V18 — Card Status + In-Site Tracker Login
- Added a visible status dropdown directly to every opportunity card: Not Started, Saved, Applied, Interview, Offer, Rejected, Not Eligible.
- Status changes on cards persist to the same tracker state used by the Track Applications page.
- Added the same editable status dropdown to tracked application rows.
- Fixed the tracker persistence key used by `saveState()` so status/favorite/note updates are stored under the signed-in email key (or guest key).
- Kept Sign In inside the VA CONNECT website UI; no external login page is used.
- Firebase Authentication can be connected later for secure cross-device accounts. The current email-based profile is a client-side tracker identity, not a production authentication service.

## V19 Card Action Layout
- Opportunity cards now use a clean two-row action layout: Preview + status dropdown on the first row, with a full-width rectangular Visit / Apply CTA underneath.
- Status remains directly editable on each card and continues to persist into Track Applications.

### V21 — Cover branding cleanup
- Removed broken/remote agency logo image loading from cards.
- Moved agency branding treatment into the promotional cover area so broken inline images cannot appear.
- Kept tracker identity cards stable while the opportunity card cover carries the agency brand treatment.


## V22 — Cover Agency Logos
- Added the user-supplied agency logo pack under `assets/agency-logos/`.
- Mapped 87 supplied logos to matching VA CONNECT opportunity records.
- Logos render inside the promotional card cover to avoid broken inline logo images.
- Agencies without a supplied/mapped logo keep the existing text fallback.
- No remote logo URLs are required for the card cover.


## V23 Card Action Layout
- Preview and application-status dropdown now sit side-by-side on the same row.
- Visit / Apply is a full-width rectangular action below them.
- Existing status persistence, tracker routing, and 118 opportunities are preserved.


V24: Replaced the BELAY cover logo with the user-supplied official positive logo asset.


## V25 URL refresh — 2026-09-20
- Updated the agency application/website URLs supplied by the user for the current directory entries.
- Applied the exact user-supplied URLs where an existing agency matched.
- Ignored the duplicate CrewBloom URL and the VA CONNECT site URL because they are not separate agency records.
- Corrected the malformed Uplers/SmartPA pasted URL into two separate agency URLs.
- Preserved all 118 agency records, logos, tracker behavior, card layout, and existing functionality.

### V26 — Supplied Logo Fill
- Added the latest user-supplied logo pack to `assets/agency-logos/`.
- Filled previously unmapped cards only where the supplied file matched the agency unambiguously:
  - BruntWork
  - VaVa Virtual Assistants
- Kept unsupported agencies without a verified supplied logo rather than using broken remote images, generated logos, or initials as fake logos.

### V28 — Restore All Available Agency Logos
- Restored the complete supplied local logo set from the prior project/logo packs.
- Cards use the real logo inside the compact cover logo box.
- Tracker rows now use the same real logo box instead of initials.
- Agencies without a supplied local logo now try the agency website favicon from its own official domain.
- No iframe preview; official sites remain Visit / Apply destinations.
