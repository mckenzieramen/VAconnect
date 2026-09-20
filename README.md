# VA CONNECT — Interactive Opportunity Directory v3

## Branding
- VA CONNECT
- Connect. Delegate. Elevate.
- VA CONNECT logo included as `va-connect-logo.png`

## Directory
- Imports all 118 entries from the supplied Global VA Agencies workbook.
- Search by agency, role, region, scope, or eligibility text.
- Filter by applicant scope, region, and application status.
- Each opportunity uses a cover-first visual card inspired by the approved VA CONNECT design direction.
- The **Visit / Apply** button opens the listed official website/careers URL in a new tab.
- The **Details** action opens a focused details panel with eligibility, reach, roles, notes, and tracking controls.

## Application tracking
Statuses:
- Not Started
- Saved
- Applied
- Interview
- Offer
- Rejected
- Not Eligible

Notes and status changes are persisted in browser storage. Signed-in users get a separate local tracker namespace per email.

## Account feature
- Sign In and Create Account UI included.
- Email/password is hashed with Web Crypto before local storage.
- Session is kept locally on the device.
- This is intentionally a lightweight client-side account feature, not server-side authentication. For production authentication across devices, connect the same UI to Firebase Authentication or another backend later.

## Deployment
Static HTML/CSS/JS. Cloudflare Pages settings:
- Project: `roadvaconnect`
- Branch: `main`
- Framework: None
- Build command: blank
- Output directory: `/`
