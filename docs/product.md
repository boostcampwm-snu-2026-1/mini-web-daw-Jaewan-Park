# Product Definition

## Product Goal

Build a browser-first mini DAW for creating electronic music with short clips. The app should become a practical music-making tool, not just a demo, while keeping the first milestones narrow enough to implement and verify.

## Target Users

- Electronic music beginners who want a fast browser-based sketchpad.
- Musicians who want to create short loops without installing a desktop DAW.
- Developers and audio experimenters who want a small, understandable Web Audio codebase.

## Core Workflow

1. Open the browser app.
2. Create or select a 1-bar clip.
3. Add drum events in a 16-step sequencer.
4. Add pitched notes in a piano roll.
5. Start loop playback and edit while listening.
6. Later, arrange clips into a larger song.

## MVP Definition

The MVP is a browser-first 1-bar hybrid clip editor with:

- 16-step drum sequencer.
- Basic piano roll.
- Loop playback.
- Bundled starter samples.
- Basic project JSON export/import later.
- Serializable project state.

## Non-goals

- Full DAW replacement scope.
- Realtime audio recording.
- VST/plugin support.
- Cloud sync.
- Multiplayer collaboration.
- Advanced mastering tools.
- Desktop packaging before the browser app is useful.

## Success Criteria

- Users can create a short 1-bar loop with drums and pitched notes.
- Playback timing is stable enough for simple electronic music loops.
- Project data can be represented as JSON without runtime audio objects.
- The codebase separates UI rendering, project state, persistence, and audio scheduling.
- Future contributors can pick up feature specs and implement small, reviewable tasks.

## Important Product Principles

- Timing correctness matters.
- React UI must not own exact audio timing.
- Musical time is stored in ticks, not seconds.
- Project data must be serializable.
- Runtime audio objects such as `AudioBuffer` are not stored in project JSON.
- Use CSS Modules for component styles.
- Avoid unnecessary dependencies.
- Prefer small, focused changes.
