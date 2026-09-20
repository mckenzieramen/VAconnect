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
