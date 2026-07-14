# Take Your Time

An interactive Persona 5 Royal daily planner inspired by the game calendar's transit-screen presentation.

## Features

- Curved, selectable in-game date rail with a dagger day marker
- Complete live daily route with class answers, palace prep, daytime and evening actions
- Search across dates, Confidants, dialogue answers, and activities
- Per-action checklist, next-open-day navigation, and offline guide cache
- Confidant rank tracking, including Royal deadline safeguards
- Responsive desktop and mobile layouts
- Python walkthrough scraper and schedule optimizer

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run `npm run build` for a production build.

## Walkthrough pipeline

The scripts in `pipeline/` normalize a public walkthrough into JSON and allocate flexible time by Royal deadline slack, then unfinished Confidant rank, then Social Stats. See `pipeline/README.md` for setup and usage.

The app refreshes the maintained Aqiu384 route in the browser, validates that the returned calendar is complete, and retains the last good copy for offline use. GameFAQs and Neoseeker are linked in the UI as independent strategy cross-checks.

Progress in the web app is intentionally device-local. No account or database is required.
