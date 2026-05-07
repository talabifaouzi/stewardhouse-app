# StewardHouse App

Formal React/Vite build for the StewardHouse platform. Four-surface architecture: Individual, Enterprise, Advisor, Operations.

## Architecture

Four user surfaces, each with its own information architecture and persistent chrome:

- **Individual** (`/individual`) — for athletes, musicians, entertainers, creators using StewardHouse personally.
- **Enterprise** (`/enterprise`) — for athletic departments and institutions. Includes nested sub-flows for compliance, setup, and onboarding.
- **Advisor** (`/advisor`) — for philanthropic professionals managing a practice. 8-section IA: practice header, client roster, client workspace, curriculum library, cohort space, between-session pipeline, documentation hub, practice settings.
- **Operations** (`/operations`) — internal admin view for StewardHouse staff to monitor and support across all three end-user surfaces.

Sub-flows nest inside their parent surface (e.g., `/enterprise/compliance` rather than `/compliance` at top level).

## Brand identity

Brand foundation is consistent across all surfaces:

- Background: `#FAF7F2` (warm beige)
- Accent: `#8B7355` (bronze)
- Serif headings: Libre Baskerville
- Body text: Inter
- Card surfaces: white with subtle borders
- WCAG AA contrast minimum
- SVG icons, no emoji
- No AI-generated picture art

## Local development

```
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Deployment

Auto-deploys to Cloudflare Pages on every push to `main`. Live URL: `stewardhouse-app.pages.dev`.

## Project structure

```
src/
├── App.jsx                 # Root component with routing
├── main.jsx                # Entry point
├── styles/
│   ├── tokens.css          # Brand design tokens (CSS custom properties)
│   └── global.css          # Global resets and base styles
├── components/             # Shared component library
├── surfaces/               # Per-user-type surfaces
│   ├── landing/            # Demo entry point — surface picker
│   ├── individual/
│   ├── enterprise/         # Includes compliance, setup, onboarding sub-flows
│   ├── advisor/            # 8-section IA
│   └── operations/         # Internal admin
└── data/                   # Fictional data fixtures
```

## Notes for builders

This is a prototype/demo build — not production. No backend, no auth, no real data. All content is fictional. Every interaction surface is intentionally non-financial-advice and non-fiduciary per Path B boundary.
