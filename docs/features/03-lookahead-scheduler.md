# Feature: 03 Lookahead Scheduler

## Status
In Progress

## Goal

Implement tick-based lookahead scheduling for 1-bar clip loop playback.

## Context

React UI timers are not accurate enough for musical timing. The audio engine needs scheduler logic that converts ticks to `AudioContext.currentTime` and schedules events ahead of playback.

## Scope

Included:
- Add tick-to-seconds and tick-to-audio-time utilities.
- Schedule tick-based events against `AudioContext.currentTime`.
- Support looping a 1-bar clip from tick 0 to tick 1920.
- Keep scheduler logic independent from React.
- Add scheduler state for play, stop, current tick, and loop range.
- Add tests for tick conversion and loop boundary behavior where practical.

Excluded:
- Drum sequencer UI.
- Piano roll UI.
- Arrangement playback.
- User sample import.
- Effects.
- Advanced tempo automation.

## Constraints
- Use PPQ 480 unless the data model is explicitly updated.
- Treat a 4/4 bar as 1920 ticks.
- Treat a 16-step grid step as 120 ticks.
- Do not rely on UI timers for exact playback.
- Avoid double-triggering events at loop boundaries.

## Done when
- Scheduler can start and stop loop playback for a selected 1-bar clip model.
- Events are scheduled in advance using Web Audio time.
- Tick conversion utilities are covered by tests.
- Loop boundary behavior is documented and tested where practical.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Play a simple 1-bar event pattern and listen for steady looping.
- Confirm stop and restart do not leave stale scheduled behavior beyond the documented schedule-ahead window.

## PR notes
- Summarize scheduler timing constants.
- Explain known limitations of manual audio timing verification.
