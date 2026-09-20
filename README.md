# VA CONNECT — v4

## Safe Edit Update

This build preserves the approved VA CONNECT v3 visual direction and fixes the root cause of the blank/non-navigable page: the JavaScript/data files were not loaded by `index.html`.

### Preserved
- VA CONNECT branding and logo
- Cover-first opportunity cards
- 118-opportunity directory
- Search and filters
- Visit / Apply links
- Details modal
- Application status tracking
- Notes
- Local account sign-in/register UI
- Responsive navigation and mobile layout

### Fixed
- `agencies.js` is now loaded before the application script.
- `script.js` is now loaded at the end of the document so all DOM elements exist before initialization.
- Existing functionality is preserved; no unrelated redesign or data changes were made.
