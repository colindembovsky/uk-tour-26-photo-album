# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Family and friends of Colin, browsing casually (phone or laptop, often from a shared link) to see his October 2026 trip to Edinburgh, London, Belfast and Dublin. They want to feel along for the ride, not study an archive.

## Product Purpose
A personal photo album of the trip, published as a static site on GitHub Pages. Each city opens with a one-paragraph "history of" introduction, followed by its photos with short captions. Viewers can browse it as an album or sit back in slideshow mode. Success: it's fun to flick through and feels simple and elegant.

## Positioning
A curated, captioned travel story told city by city in trip order, not a dump of camera rolls or a generic gallery template.

## Operating Context
- Trip order: Edinburgh (Oct 4–5), London (Oct 6), Belfast (Oct 7–8), Dublin (Oct 9).
- Shared via link; most viewers will be on phones.

## Capabilities and Constraints
- Static hosting only (GitHub Pages): no server, no database.
- Two viewing modes: album (scroll/browse) and slideshow.
- Source photos live in `photos/<city>/`; phone shots are ~4000px `.jpg`, camera shots are `.jpeg` (872A… names).
- Camera `.jpeg` files currently on disk are 200px thumbnails; Colin will re-export at ~2400px. The build must not ship the thumbnails as full-size images.
- Total source size is ~215MB; images must be resized/compressed for the web.
- Dublin includes two videos (16MB, 61MB); they stay in, compressed, and play only on tap.
- Belfast currently has very few photos (2 phone + 4 camera).

## Brand Commitments
- Tone: warm and personal, written for family and friends.
- Copy: the assistant drafts city history paragraphs and photo captions; Colin edits. Copy must live somewhere easy for him to edit.

## Evidence on Hand
- Photos: `photos/edinburgh` (35), `photos/london` (25), `photos/belfast` (2 + 4 in `canon/`), `photos/dublin` (43 photos + 2 videos).
- No existing captions, history copy, or site code yet.

## Product Principles
1. The photos are the star; the interface stays out of the way.
2. Every city tells a story: history first, then the trip.
3. Fast on a phone over mobile data.
4. Easy for Colin to edit the words without touching layout code.
