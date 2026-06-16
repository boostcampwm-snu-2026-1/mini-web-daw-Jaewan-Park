# mini-web-daw-Jaewan-Park

A browser-first mini DAW prototype for creating electronic music with clips, step sequencing, piano-roll notes, arrangement playback, and local project persistence.

## Product Goal

Build a practical clip-based music sketching tool that can grow beyond a demo while staying focused, serializable, and timing-conscious. React renders the interface, but exact audio scheduling belongs to the Web Audio engine.

## Stack

- Vite
- React
- TypeScript
- CSS Modules
- Web Audio API
- IndexedDB for browser-local project and imported sample persistence
- ESLint, Vitest, and Vite build checks

## Current Status

The app is an early browser-based DAW prototype, not a full DAW replacement. Current develop-branch functionality includes:

- Main DAW shell with transport, sidebar, clip editor, and arrangement mode.
- Drum step sequencer with lane sample selection, lane ordering, and step subdivisions.
- Piano roll note editing with Default Synth and Iowa Piano playback paths.
- Pattern and song transport playback with pause/resume, playhead, BPM control, and loop ranges.
- Clip sidebar workflows for creating, renaming, deleting, importing WAV files, and adding/removing instruments.
- Arrangement view for placing clips, moving/deleting clip instances, looped arrangement playback, adjustable arrangement length, mixer controls, and WAV export.
- Browser-local IndexedDB persistence, imported audio blob persistence, and multiple local projects.

Known limits:

- Project storage is local to the current browser profile.
- There is no cloud sync, account system, realtime recording, plugin support, or advanced mastering workflow.
- Some UI flows still use simple browser dialogs while the core behavior is being stabilized.

## Getting Started

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Documentation

- [Product definition](docs/product.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Audio engine](docs/audio-engine.md)
- [UI and design](docs/ui-design.md)
- [Testing strategy](docs/testing.md)
- [Code conventions](docs/code-conventions.md)
- [Project plans](PLANS.md)
- [Agent instructions](AGENTS.md)
- [Feature specs](docs/features/)

Course-facing planning and workflow notes are maintained in the [GitHub Wiki](https://github.com/boostcampwm-snu-2026-1/mini-web-daw-Jaewan-Park/wiki).

## Development Workflow

Feature work is planned through GitHub Issues and feature specs under `docs/features/`. Implementation PRs target `develop` by default. Changes should stay small, keep project data serializable, store musical time in ticks, and keep React UI separate from exact audio scheduling.
