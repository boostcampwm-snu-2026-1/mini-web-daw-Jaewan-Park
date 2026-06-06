# Feature: 07 Transport Pause and Playhead

## Status
Planned

## Goal

Implement distinct pause, resume, and stop behavior for clip playback, and render a vertical runtime playhead in clip editors.

## Context

The current transport has only `playing` and `stopped` states. The play button can show a pause icon while playback is active, but pressing it stops playback in the same way as the stop button.

Before piano roll playback and hybrid clip loop playback become more complex, the app needs a clearer runtime transport model:

- Play from stopped starts at the beginning of the selected 1-bar clip.
- Pause stops playback while preserving the current musical tick.
- Resume continues from the paused tick.
- Stop stops playback and resets the playhead to the beginning.

The visual playhead helps users understand where sequenced drum and note events are playing. It must not become the timing source for audio playback.

## Scope

Included:
- Add a `paused` transport state.
- Track the current runtime playhead position in ticks.
- Capture the current tick when pausing.
- Resume playback from the paused tick.
- Stop playback and reset the runtime playhead to tick 0.
- Render a vertical playhead in the piano roll editor.
- Render a playhead in the drum step sequencer if practical for the same implementation pass.
- Keep visual playhead animation driven by `requestAnimationFrame`.
- Keep exact audio scheduling driven by `AudioContext.currentTime`.
- Add focused tests for transport tick calculations, pause/resume offsets, and loop wrapping where practical.
- Update relevant docs if the audio engine API or transport state model changes.

Excluded:
- Arrangement timeline playhead.
- Timeline scrubbing.
- Realtime recording.
- Automation.
- Tempo automation.
- Persisting runtime playhead position in project JSON.
- Full transport keyboard shortcut support.

## Constraints

- Store musical position in ticks, not seconds.
- Use PPQ 480, with the M1 1-bar loop spanning ticks 0 through 1920.
- Treat the paused playhead position as runtime state, not serializable project data.
- Do not store `AudioContext`, `AudioBuffer`, scheduler timers, source nodes, or playhead timers in project JSON.
- React UI may display transport state and playhead position, but must not own exact audio timing.
- The audio engine and scheduler must remain independent from React components.
- The visual playhead may be approximate; audible event timing must remain scheduled against `AudioContext.currentTime`.
- Use CSS Modules and semantic design tokens for playhead styling.
- Inline styles are acceptable for computed playhead geometry, such as `transform`, `left`, or width derived from ticks.

## Done when

- Transport state can represent `stopped`, `playing`, and `paused`.
- Pressing play from stopped starts playback from tick 0.
- Pressing pause while playing stops scheduling and preserves the current playhead tick.
- Pressing play from paused resumes playback from the paused tick.
- Pressing stop from playing or paused stops playback and resets the playhead to tick 0.
- The piano roll displays a vertical playhead aligned to the 1-bar grid.
- The playhead wraps cleanly at the 1-bar loop boundary.
- If included, the drum step sequencer displays a playhead or equivalent step-position indicator aligned to the 16-step grid.
- Existing drum step playback behavior still works.
- Tests cover pure transport/tick math where practical.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Start playback from stopped and confirm the playhead starts at the beginning.
- Pause playback and confirm the playhead stops at its current position.
- Resume playback and confirm it continues from the paused position.
- Stop playback and confirm the playhead returns to the beginning.
- Confirm the visual playhead loops across the 1-bar clip without jumping outside the editor grid.
- Confirm drum steps still trigger at the expected musical positions after pause/resume.

## PR notes
- Describe the transport state model and runtime tick fields added or changed.
- Explain how pause differs from stop.
- Explain how the visual playhead reads timing state without driving audio scheduling.
- Note whether drum sequencer playhead display was included or deferred.
