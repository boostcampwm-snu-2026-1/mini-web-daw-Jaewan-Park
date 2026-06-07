# Feature: 10 Tempo Control and BPM Slider

## Status
In Review

## Goal

Make the transport BPM slider control the app's actual playback tempo.

The slider should not be only visual state. It should update the tempo used by the audio engine for drum and note scheduling.

## Context

The main UI shell added a BPM display and slider. Later playback features connected clip playback to the audio engine, but tempo control has not been planned as its own implementation task.

The current app state has a `bpm` value and passes that value when playback starts. A focused tempo-control feature is still needed so BPM changes behave consistently across stopped, paused, and playing transport states.

This should happen before advanced sampler sustain because tempo affects all scheduled drum and note events.

## Scope

Included:
- Treat BPM as the current project/transport tempo state.
- Keep tempo serializable as `tempoBpm` in project-level data or documented app-level project state until full project persistence exists.
- Keep the BPM slider and displayed BPM in sync.
- Start playback with the current BPM.
- Resume playback from pause using the current BPM.
- Apply BPM changes during active playback to future scheduler windows.
- Preserve or recompute the current runtime playhead tick consistently when tempo changes.
- Validate or clamp BPM to the supported UI range.
- Add focused tests for tempo updates, tick/time conversion, and scheduler behavior where practical.
- Update relevant data model, audio engine, UI, and testing docs.

Excluded:
- Tempo automation lanes.
- Arrangement tempo maps.
- Smooth tempo ramps.
- Tap tempo.
- Metronome.
- Swing or groove timing.
- Keyboard shortcuts for tempo editing.
- Project export/import changes beyond documenting the serializable tempo field.

## Constraints

- React UI must not own exact audio timing.
- Musical event positions stay in ticks, not seconds.
- Schedule playback against `AudioContext.currentTime`.
- Tempo is serializable project data, but `AudioContext`, scheduler timers, Web Audio nodes, and runtime transport snapshots are runtime-only.
- Do not introduce runtime dependencies unless clearly justified.
- Keep the audio engine API small and typed.

## Tempo Change Approach

When the transport is stopped:
- Updating BPM should update the displayed value and the stored current tempo.
- The next play action should start with that tempo.

When the transport is paused:
- Updating BPM should update the displayed value and stored current tempo.
- Resume should continue from the paused tick using the new tempo.

When the transport is playing:
- Updating BPM should affect future scheduled windows.
- Prefer an audio-engine method that updates scheduler tempo while preserving the current runtime tick.
- If restarting the loop from the current tick is simpler and safer for the first implementation, keep the scheduling window short and document any audible limitation.

Do not use React timers as the source of exact tempo or event timing.

## Done when

- Moving the BPM slider updates the displayed BPM.
- Starting playback uses the displayed BPM.
- Pausing and resuming playback uses the current BPM.
- Changing BPM during playback changes future drum and note scheduling.
- The visual playhead remains aligned with the audio engine transport snapshot after tempo changes.
- Invalid BPM values are rejected or clamped safely.
- Event positions remain tick-based and unchanged by tempo edits.
- Relevant docs and tests are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Move the BPM slider while stopped and confirm playback starts at that tempo.
- Move the BPM slider while paused and confirm resume uses the new tempo.
- Move the BPM slider while playing and confirm future steps and notes speed up or slow down.
- Confirm the playhead remains aligned with loop playback.
- Confirm drum and piano roll events still trigger at their tick positions.

## PR notes

- Explain how tempo is represented in state and passed to the audio engine.
- Explain how tempo changes are applied while stopped, paused, and playing.
- Note whether active playback updates scheduler tempo directly or restarts from the current tick.
- Mention any audible limitation when changing tempo during playback.
