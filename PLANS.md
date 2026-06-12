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

1. #32 Drum step subdivisions -> `docs/features/13-drum-step-subdivisions.md` (PR #37 in review)

## Planned Milestones

1. Project scaffold.
2. AudioContext and sample playback.
3. Lookahead scheduler.
4. Drum step sequencer.
5. Basic piano roll.
6. Transport pause/resume and editor playhead.
7. Pitched instrument selection and Iowa Piano one-shot playback.
8. Tempo control and live BPM updates.
9. Arrangement view UI shell.
10. Sampler advanced sustain.
11. Sidebar clip and instrument management.
12. Drum step subdivisions.
13. Arrangement mixer panel UI shell.
14. Hybrid clip loop playback.
15. Sample import.
16. Project export/import.
17. IndexedDB autosave.
18. Arrangement data model.
19. Arrangement editing and playback.
20. Mixer audio routing.
21. Basic effects.

## Backlog

- Keyboard shortcuts for transport and editing.
- Basic undo and redo.
- Velocity editing for drum and note events.
- Clip duplication.
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
