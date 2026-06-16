# Feature: 08 Pitched Instruments and Sustain

## Status
Done

## Goal

Add selectable pitched instruments for piano roll playback:

- `Default Synth`: keep the current oscillator-based instrument.
- `Iowa Piano`: play the bundled Iowa Piano WAV samples from their audible attack offsets.

## Context

The basic piano roll can now create, move, delete, and play tick-based note events. Its current playback path uses a simple oscillator synth. That behavior is useful because it can hold notes for their full `durationTicks`, but it does not sound like a piano.

The project includes bundled Iowa Piano WAV samples for C4 through C5:

```text
public/samples/pitched_instruments/Iowa_Piano/
```

The next step is to keep the oscillator as a named instrument while adding a sample-based piano instrument that sounds more like a piano. Since the samples are not intended as full sampler-ready sustained loops yet, the first Iowa Piano implementation should avoid looping and leave advanced sustain for a follow-up sampler task.

## Scope

Included:
- Define separate pitched instrument choices for `Default Synth` and `Iowa Piano`.
- Preserve current oscillator playback behavior as `Default Synth`.
- Add sidebar instrument entries for selecting which pitched instrument's notes are visible in the piano roll.
- Play Iowa Piano notes using the bundled C4-C5 WAV files.
- Play Iowa Piano samples once from documented start offsets.
- Use a short gain attack and release envelope to reduce clicks.
- Stop active sample voices cleanly when transport stops.
- Keep musical time in ticks and convert note durations at playback time.
- Keep instrument/sample metadata serializable.
- Keep `AudioBuffer`, `AudioBufferSourceNode`, `OscillatorNode`, `GainNode`, and active voice state runtime-only.
- Add focused tests for instrument metadata, sample mapping, and sample start offset behavior where practical.
- Update relevant audio, data model, UI, and testing docs.

Excluded:
- Full general-purpose sampler architecture.
- User sample import.
- Automatic loop point detection.
- Sustain looping, including crossfaded sustain looping.
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

Start with a conservative sample-instrument strategy:

- Each Iowa Piano sample zone may define `sampleStartSeconds` to skip leading silence before the audible attack.
- Iowa Piano sample zones should not define `loopStartSeconds` or `loopEndSeconds` in this task.
- Do not enable `AudioBufferSourceNode.loop` for Iowa Piano in this task.
- Use gain attack and release envelopes so note starts and note-offs do not click.
- Long Iowa Piano notes may naturally decay or end when the sample ends. Avoid repeated-strike artifacts over artificial sustain.

Full sustain loop tuning remains incomplete and should move to a separate advanced sampler sustain issue.

## Done when

- Users can choose between `Default Synth` and `Iowa Piano` for piano roll playback.
- `Default Synth` keeps the current oscillator-style held-note behavior.
- `Iowa Piano` plays the bundled Iowa Piano sample for the note pitch when possible.
- Iowa Piano notes play from the audible attack offset and do not repeat when notes are longer than the sample tail.
- Stopping transport clears active Iowa Piano voices.
- Sample loading errors do not break the whole UI; the app should report an audio error or fall back in a controlled way.
- Instrument metadata and note events remain serializable.
- `Default Synth` and `Iowa Piano` notes can coexist in the same clip and play together.
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
- Create short and long Iowa Piano notes and confirm long notes do not retrigger or sound like repeated strikes.
- Stop playback and confirm no active notes remain stuck.
- Switch instruments and confirm the selected piano roll playback sound changes predictably.

## PR notes
- Explain how `Default Synth` and `Iowa Piano` are represented.
- Document that advanced sampler sustain is deferred.
- Note that Iowa Piano sustain looping is intentionally deferred.
- Mention whether instrument selection is runtime-only or stored in serializable clip/project state.
