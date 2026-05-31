# Feature: 02 AudioContext and Sample Playback

## Status
In Review

## Goal

Add basic Web Audio setup and one-shot playback for bundled drum samples.

## Context

The mini DAW needs a small audio engine before sequenced playback. This task should establish `AudioContext` lifecycle handling, sample loading and decoding, and a typed playback API.

## Scope

Included:
- Create an audio engine module under `src/audio/`.
- Set up `AudioContext` creation/resume behavior.
- Load bundled drum samples when the scaffold has an asset strategy.
- Decode samples into runtime `AudioBuffer` objects.
- Store decoded buffers in a runtime cache keyed by sample ID.
- Add one-shot sample playback.
- Expose a small typed API to the UI.
- Add minimal manual UI only if useful for verifying playback.

Excluded:
- Sequenced playback.
- Lookahead scheduler.
- Drum sequencer UI.
- Piano roll UI.
- User sample import.
- Arrangement playback.
- Effects or mixer.

## Constraints
- Do not store `AudioBuffer` objects in project JSON.
- Create a new `AudioBufferSourceNode` for each one-shot playback.
- Keep audio engine logic independent from React components.
- Avoid new dependencies unless clearly justified.

## Done when
- A user gesture can initialize or resume audio.
- Bundled sample metadata can resolve to decoded runtime buffers.
- A sample can be triggered repeatedly as a one-shot.
- The UI calls a typed audio API rather than Web Audio internals directly.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- In the browser, trigger each available sample more than once and confirm playback works.
- Stop/reload the page and confirm audio setup handles browser autoplay policy.

## PR notes
- Document where runtime buffers are cached.
- Mention any browser-specific behavior observed during manual testing.
