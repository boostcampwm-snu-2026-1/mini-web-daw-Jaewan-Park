# Feature: 08 Pitched Instruments and Sustain

## Status
Planned

## Goal

Add selectable pitched instruments for piano roll playback:

- `Default Synth`: keep the current oscillator-based instrument.
- `Iowa Piano`: play the bundled Iowa Piano WAV samples and support long notes with a first sustain implementation.

## Context

The basic piano roll can now create, move, delete, and play tick-based note events. Its current playback path uses a simple oscillator synth. That behavior is useful because it can hold notes for their full `durationTicks`, but it does not sound like a piano.

The project includes bundled Iowa Piano WAV samples for C4 through C5:

```text
public/samples/pitched_instruments/Iowa_Piano/
```

The next step is to keep the oscillator as a named instrument while adding a sample-based piano instrument that sounds more like a piano. Since the samples are not intended as full sampler-ready sustained loops yet, the first sustain implementation should be pragmatic, documented, and easy to adjust.

## Scope

Included:
- Define separate pitched instrument choices for `Default Synth` and `Iowa Piano`.
- Preserve current oscillator playback behavior as `Default Synth`.
- Add an instrument selector for piano roll playback.
- Play Iowa Piano notes using the bundled C4-C5 WAV files.
- Add a first sustain implementation for long Iowa Piano notes.
- Use a short gain attack and release envelope to reduce clicks.
- Stop active sustained voices cleanly when transport stops.
- Keep musical time in ticks and convert note durations at playback time.
- Keep instrument/sample metadata serializable.
- Keep `AudioBuffer`, `AudioBufferSourceNode`, `OscillatorNode`, `GainNode`, and active voice state runtime-only.
- Add focused tests for instrument metadata, sample mapping, and pure sustain/loop calculations where practical.
- Update relevant audio, data model, UI, and testing docs.

Excluded:
- Full general-purpose sampler architecture.
- User sample import.
- Automatic loop point detection.
- Crossfaded sustain looping unless it is simple enough for the first pass.
- Advanced ADSR editing UI.
- Velocity editor UI.
- Arrangement playback.
- Persistence/export of full instrument presets beyond simple serializable IDs/metadata needed for this feature.

## Constraints

- React UI must not own exact audio timing.
- Schedule playback against `AudioContext.currentTime`.
- Store note start and duration in ticks.
- Keep project data serializable.
- Do not store `AudioBuffer` or Web Audio nodes in project JSON.
- Do not introduce runtime dependencies unless clearly justified.
- Use CSS Modules and semantic design tokens for UI changes.
- Preserve `Default Synth` behavior so piano roll playback still works even if sample loading fails.

## Sustain Approach

Start with an explicit sample-instrument sustain strategy:

- Each Iowa Piano sample zone may define `loopStartSeconds` and `loopEndSeconds`.
- If loop metadata exists and the note duration exceeds the sample's natural decay, use `AudioBufferSourceNode.loop = true` with those loop points.
- Use gain attack and release envelopes so note starts and note-offs do not click.
- If a loop point sounds bad for a sample, tune the metadata rather than adding automatic DSP in this task.

If no reliable loop metadata is ready during implementation, the fallback should still play the sample with a release envelope and document that full sustain loop tuning remains incomplete.

## Done when

- Users can choose between `Default Synth` and `Iowa Piano` for piano roll playback.
- `Default Synth` keeps the current oscillator-style held-note behavior.
- `Iowa Piano` plays the bundled Iowa Piano sample for the note pitch when possible.
- Long Iowa Piano notes continue audibly beyond the raw attack/decay using the documented sustain approach.
- Stopping transport clears sustained Iowa Piano voices.
- Sample loading errors do not break the whole UI; the app should report an audio error or fall back in a controlled way.
- Instrument metadata and note events remain serializable.
- Relevant docs and tests are updated.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Create notes in the piano roll.
- Confirm `Default Synth` still sounds like the current oscillator instrument.
- Select `Iowa Piano` and confirm notes sound piano-like.
- Create short and long Iowa Piano notes and confirm long notes sustain audibly.
- Stop playback and confirm no sustained notes remain stuck.
- Switch instruments and confirm the selected piano roll playback sound changes predictably.

## PR notes
- Explain how `Default Synth` and `Iowa Piano` are represented.
- Document the sustain loop strategy and any loop point values used.
- Note any samples whose loop points still need tuning.
- Mention whether instrument selection is runtime-only or stored in serializable clip/project state.
