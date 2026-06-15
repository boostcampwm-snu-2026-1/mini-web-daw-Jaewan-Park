# mini-web-daw-Jaewan-Park

A Web Audio API-based mini DAW for sequencing synthesized and sampled instruments in the browser.

## Description

This project is an early browser-first mini DAW for creating electronic music with short clips. The planned first experience is a 1-bar hybrid clip editor that combines drum step sequencing, basic piano roll editing, and loop playback.

## Product Goal

Build a practical clip-based music creation tool that can grow beyond a demo while staying focused, serializable, and timing-conscious. React renders the interface, but exact audio scheduling belongs to the Web Audio engine.

## Planned Stack

- Vite
- React
- TypeScript
- CSS Modules
- Web Audio API
- npm scripts for development, checks, tests, and production builds

## Current Status

The project has an initial Vite + React + TypeScript scaffold and early DAW UI/audio features under active development. Arrangement placement, arrangement playback, persistence, and broader song-building workflows are still planned work.

## Getting Started

These are the intended commands after the scaffold is added:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

The scaffold provides these scripts. Feature-specific behavior will be added in later milestones.

## Documentation Map

- [Product definition](docs/product.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Audio engine](docs/audio-engine.md)
- [UI and design](docs/ui-design.md)
- [Testing strategy](docs/testing.md)
- [Code conventions](docs/code-conventions.md)
- [Project plans](PLANS.md)
- [Agent instructions](AGENTS.md)

Feature task specs:

- [01 Project Scaffold](docs/features/01-project-scaffold.md)
- [02 AudioContext and Sample Playback](docs/features/02-audio-context-and-sample-playback.md)
- [03 Lookahead Scheduler](docs/features/03-lookahead-scheduler.md)
- [04 Drum Step Sequencer](docs/features/04-drum-step-sequencer.md)
- [05 Basic Piano Roll](docs/features/05-basic-piano-roll.md)
- [06 Main DAW UI Shell](docs/features/06-main-daw-ui-shell.md)
- [07 Transport Pause and Playhead](docs/features/07-transport-pause-and-playhead.md)
- [08 Pitched Instruments and Sustain](docs/features/08-pitched-instruments-and-sustain.md)
- [09 Sampler Advanced Sustain](docs/features/09-sampler-advanced-sustain.md)
- [10 Tempo Control and BPM Slider](docs/features/10-tempo-control-and-bpm-slider.md)
- [11 Arrangement View UI Shell](docs/features/11-arrangement-view-ui-shell.md)
- [12 Sidebar Clip and Instrument Management](docs/features/12-sidebar-clip-instrument-management.md)
- [13 Drum Step Subdivisions](docs/features/13-drum-step-subdivisions.md)
- [14 Arrangement Mixer Panel UI Shell](docs/features/14-arrangement-mixer-panel-ui-shell.md)
- [15 WAV File Import as Audio Clip](docs/features/15-wav-file-import-as-audio-clip.md)
- [16 Arrangement Clip Placement and Playback](docs/features/16-arrangement-clip-placement-and-playback.md)
- [17 Mixer Audio Routing and Track Controls](docs/features/17-mixer-audio-routing-and-track-controls.md)
- [18 IndexedDB Project Persistence](docs/features/18-indexeddb-project-persistence.md)
- [19 Variable Hybrid Clip Length](docs/features/19-variable-hybrid-clip-length.md)
- [20 Adjustable Arrangement Length](docs/features/20-adjustable-arrangement-length.md)
- [21 Arrangement WAV Export](docs/features/21-arrangement-wav-export.md)
- [22 Multi-project Management](docs/features/22-multi-project-management.md)

## Initial Roadmap

1. Create the Vite + React + TypeScript scaffold.
2. Add Web Audio `AudioContext` setup and one-shot sample playback.
3. Add a lookahead scheduler for tick-based loop playback.
4. Build a 16-step drum sequencer.
5. Build a basic 1-bar piano roll.
6. Combine drum and note events into hybrid clip loop playback.
7. Import local WAV files as audio clips.
8. Place clips on the arrangement timeline and play the arranged song.
9. Connect mixer faders, mute, solo, and meters to real audio routing.
10. Add browser-local project persistence with IndexedDB.
11. Support longer hybrid clips and adjustable arrangement length.
12. Render the arrangement to a downloadable WAV file.
13. Manage multiple browser-local projects.

## Notes

The project should not overclaim working functionality while it is in planning and scaffolding. Future changes should keep project data serializable, store musical time in ticks, and keep React UI separate from exact audio timing.
