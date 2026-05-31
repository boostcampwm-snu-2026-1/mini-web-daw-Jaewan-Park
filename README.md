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

The project is in early planning and workflow setup. The Vite application scaffold and DAW features have not been implemented yet.

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

Until the scaffold exists, some or all npm scripts may be unavailable.

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

## Initial Roadmap

1. Create the Vite + React + TypeScript scaffold.
2. Add Web Audio `AudioContext` setup and one-shot sample playback.
3. Add a lookahead scheduler for tick-based loop playback.
4. Build a 16-step drum sequencer.
5. Build a basic 1-bar piano roll.
6. Combine drum and note events into hybrid clip loop playback.
7. Add project export/import and persistence features.

## Notes

The project should not overclaim working functionality while it is in planning and scaffolding. Future changes should keep project data serializable, store musical time in ticks, and keep React UI separate from exact audio timing.
