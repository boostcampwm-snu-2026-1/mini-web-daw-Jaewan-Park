# Feature: 05 Basic Piano Roll

## Status
In Review

## Goal

Build a basic 1-bar piano roll for editing note events in a hybrid clip.

## Context

Hybrid clips should contain both drum events and pitched note events. The piano roll should represent MIDI notes with tick-based start and duration values.

## Scope

Included:
- Render a 1-bar piano roll grid.
- Add and delete notes.
- Move and resize notes if practical for the first version.
- Store MIDI note numbers.
- Store note start and duration in ticks.
- Add basic oscillator/synth playback or integrate with the existing audio engine.
- Use the initial C4-C5 pitch range from the bundled Iowa Piano sample set.
- Use CSS Modules for styling.
- Use inline styles for dynamic note geometry when useful.

Excluded:
- Advanced editing tools.
- Automation.
- Arrangement view.
- Full sampler instrument.
- Quantize or swing unless already supported by utilities.
- MIDI file import/export.

## Constraints
- Store all note timing in ticks.
- Keep note geometry derived from model data.
- Keep React rendering separate from exact audio scheduling.
- Keep project state serializable.

## Done when
- Users can create and delete note events in a 1-bar clip.
- Note events store `midiNote`, `startTick`, `durationTicks`, and `velocity`.
- Basic playback is available through the audio engine path chosen for the milestone.
- Users can move created notes by dragging them on the piano roll grid.
- Styling uses CSS Modules, with inline styles only for computed geometry.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Add notes at multiple pitches and positions.
- Delete notes and confirm model state updates.
- Move notes and confirm pitch and tick position update.
- If playback exists, confirm note timing matches the grid well enough for the milestone.

## PR notes
- Summarize the note editing interactions implemented.
- Note any editing operations deferred from the first version.
