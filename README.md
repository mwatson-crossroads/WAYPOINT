# Production Hub

One place to run a church's Sunday production: plan the service once, and every system
(charts, lyrics, playback, lighting) reads from that same plan.

## Run it (the easy way)

1. Install **Node.js** (the "LTS" version) from https://nodejs.org. One time only.
2. Open this folder and double-click:
   - **Windows:** `Start Waypoint (Windows).bat`
   - **Mac:** `Start Waypoint (Mac).command` (the first time, right-click it and choose **Open**)
3. Your browser opens to Waypoint. Keep the black window open while you use it.

## Run it (developers)

```bash
npm install
npm run dev        # web UI on :5173 (hot reload) + API on :4300
```

For the production machine, build once and serve everything from one port:

```bash
npm run build && npm start   # http://<this-computer's-LAN-IP>:4300
```

Volunteers open chart links from their phones on the church Wi-Fi. Data lives in `data/hub.db` (SQLite).

## What works today (Phase 1)

| Area | Where | Notes |
| --- | --- | --- |
| Service order | Services → a service | Songs, elements and headers; per-song key, arrangement (`V1 C V2 C B C`), durations, live run-time clock, team notes, lighting descriptions (stored for Phase 3). Autosaves. |
| Scheduling | Team panel on a service | Schedule by position, track accepted/pending/declined, email or copy each volunteer's chart link. |
| Song library | Songs | ChordPro editor with live preview; paste chords-over-lyrics charts and convert them in one click. |
| Charts | Charts ↗ | Whole-service packet, transposed to the service key; chords, Nashville numbers or lyrics only; capo; prints one song per page. Each position gets its default chart type (Vocals → lyrics, Bass → numbers…). |
| Presentation | Present ↗ | Slides generated from the arrangement; click or arrow keys to go live; Clear/Black; CCLI footer on each song's first slide. |
| Outputs | Audience output, Stage display | Any browser on the network becomes an output. Double-click for full screen. |

## Layout

```
packages/core   Shared domain model + pure logic (ChordPro, transposition, Nashville, slides). Unit tested.
apps/server     Fastify + SQLite, REST API, WebSocket live channel. Runs locally on the production machine.
apps/web        React UI: planner, library, charts, presenter, outputs.
```

`npm test` runs core tests. `npm run typecheck` checks all packages.

See [ROADMAP.md](ROADMAP.md) for what's next.
