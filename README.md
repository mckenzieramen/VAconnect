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
