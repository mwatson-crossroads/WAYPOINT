# Roadmap

Guiding principles:
1. **The service plan is the source of truth.** Every module (charts, slides, playback, lighting) is a view of it.
2. **Local-first.** Sunday morning cannot depend on the internet. The hub runs on the production machine;
   cloud sync is an add-on, never a requirement.
3. **Integrate before replacing.** Where an existing tool is hard to beat or holds licensed content
   (MultiTracks stems, CCLI lyrics), sync with it first and replace it only when ours is better.
4. **AI plans, humans run.** AI generates scenes, charts and drafts ahead of time; playback during the service
   is deterministic and operator-controlled.

## Phase 1 — Foundation ✅
Service planner, song library (ChordPro), volunteer charts, scheduling, presenter + audience/stage outputs.

## Phase 2 — Lighting (Art-Net / sACN)
- Fixture patch: universes, addresses, fixture profiles (import from Open Fixture Library).
- DMX engine in the server: 44 Hz Art-Net and sACN output (works with most nodes; ENTTEC USB later).
- Scenes, cue lists per service item, timed fades, basic effects (chase, sweep, pulse).
- **AI scene builder:** the `lightingCue` text on each item + your patch → Claude returns structured scenes
  (fixture groups, colors, intensities, positions, effects). Preview in a 2D stage view, tweak, save.
- Presenter integration: going to a song section can fire its lighting cue.

## Phase 3 — Multitrack playback
- Native audio engine (likely Rust or JUCE sidecar) for multi-output interfaces: click + guide to IEMs,
  stems to FOH, sample-accurate section jumps and loops, MIDI/timecode out to lights and lyrics.
- Loads stems you own (self-recorded, originals, purchased WAV stems). MultiTracks rentals are encrypted for
  their Playback app, so the path there is **integration**: push setlists/keys/arrangements to Playback.
- Section markers drive slides and lighting automatically.

## Phase 4 — Integrations & delivery
- Planning Center Services import/export (plans, songs, people) so you can migrate gradually.
- Real notifications: email/SMS for schedule requests and chart delivery, accept/decline links.
- ProPresenter export, PDF chart export.
- Users, roles and login (required before exposing the hub beyond the church LAN).

## Phase 5 — Polish
- Media backgrounds/video on slides, themes, scripture lookup, announcements loop.
- Rehearsal mode: practice tracks + charts in one volunteer view.
- Desktop packaging (Tauri/Electron) with auto-start on the production machine.
