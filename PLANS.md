# Plans

## North Star

Create a browser-first, clip-oriented mini DAW that is useful for making electronic music. The app should favor correct timing, serializable project data, and focused workflows over broad full-DAW scope.

## Current Milestone: M1 Hybrid Clip Editor

M1 is a 1-bar hybrid clip editor. A hybrid clip may contain drum step sequencer events and piano roll note events in the same clip.

M1 should include:

- A Vite + React + TypeScript scaffold using CSS Modules.
- A documented tick-based project model with PPQ 480.
- Web Audio sample playback and sequenced lookahead scheduling.
- A 16-step drum sequencer.
- A basic piano roll.
- Loop playback for the selected 1-bar clip.

## Active Preparation Tasks

- Establish repository instructions for coding agents.
- Add product, architecture, data model, audio engine, UI, and testing documentation.
- Add feature specs for the first five implementation tasks.
- Add GitHub issue and PR templates.
- Add a CI workflow that tolerates the repository before the scaffold exists.

## Active Issue Order

Use this section as the current execution order for agent work. Feature document numbering describes the planned product sequence, but actual issue order may change as dependencies, review feedback, or implementation risks become clearer.

1. #6 Project Scaffold -> `docs/features/01-project-scaffold.md` (PR #7 in review)
2. #4 AudioContext and Sample Playback -> `docs/features/02-audio-context-and-sample-playback.md`
3. #5 Lookahead Scheduler -> `docs/features/03-lookahead-scheduler.md`
4. #3 Drum Step Sequencer -> `docs/features/04-drum-step-sequencer.md`
5. #2 Basic Piano Roll -> `docs/features/05-basic-piano-roll.md`

## Planned Milestones

1. Project scaffold.
2. AudioContext and sample playback.
3. Lookahead scheduler.
4. Drum step sequencer.
5. Basic piano roll.
6. Hybrid clip loop playback.
7. Sample import.
8. Project export/import.
9. IndexedDB autosave.
10. Arrangement data model.
11. Arrangement view.
12. Mixer and basic effects.

## Backlog

- Keyboard shortcuts for transport and editing.
- Basic undo and redo.
- Velocity editing for drum and note events.
- Clip duplication.
- BPM and transport controls.
- Starter project template.
- Metronome.
- Quantize utilities.
- Swing or groove timing after strict timing is reliable.
- MIDI file import or export.

## Frozen / Not Now

- Realtime audio recording.
- VST/plugin support.
- Cloud sync.
- Multiplayer collaboration.
- Advanced audio mastering.
- Full DAW replacement scope.
