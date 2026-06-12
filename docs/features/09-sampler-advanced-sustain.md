# Feature: 09 Sampler Advanced Sustain

## Status
In Review

## Goal

Add a reusable sampler sustain path for sample-based pitched instruments.

The first target is `Iowa Piano`, but the implementation should not be hard-coded to piano. Future bundled or imported sample instruments should be able to use the same sampler metadata and playback path.

## Context

`Default Synth` can hold long notes because it uses an oscillator. `Iowa Piano` currently plays bundled WAV samples once from explicit `sampleStartSeconds` offsets so the engine skips leading silence before the attack.

Earlier sustain looping was deferred because simple loop points made long notes sound like repeated strikes. The next sampler step should support longer sample-based notes without coupling React UI to timing and without storing runtime audio objects in project data.

This feature should add a general, metadata-driven sampler sustain mechanism. It is not a full sampler product.

## Scope

Included:
- Define serializable sampler zone metadata for sample start offset, loop region, loop mode, optional crossfade duration, and basic envelope values.
- Implement reusable sampled-note scheduling for pitched sample instruments.
- Use the general sampler path for `Iowa Piano`.
- Keep one-shot sample playback as the fallback when a zone has no valid sustain metadata.
- Support explicit loop metadata only.
- Use gain envelopes for attack and release so note starts and note-offs avoid clicks.
- Stop sustained sample voices cleanly when note duration ends, transport pauses, or transport stops.
- Keep note start and duration in ticks and convert to seconds at scheduling time.
- Keep decoded buffers, source nodes, gain nodes, and active voice state runtime-only.
- Add focused tests for sampler metadata validation, loop-region calculation, fallback behavior, and release timing helpers where practical.
- Update audio engine, data model, and testing docs.

Excluded:
- User sample import UI.
- Visual loop point editor.
- Automatic loop point detection or sample analysis.
- Full sampler preset browser.
- Multisample velocity layers.
- Round-robin sample selection.
- Time-stretching.
- Pitch-shifting beyond playback-rate mapping from `rootMidiNote`.
- Arrangement playback changes.
- New runtime dependencies unless the implementation clearly justifies them.

## Constraints

- React UI must not own exact audio timing.
- Schedule playback against `AudioContext.currentTime`.
- Store musical event time in ticks, not seconds.
- Sample-local metadata such as start offsets, loop points, and envelope lengths may be stored in seconds.
- Keep project data serializable.
- Do not store `AudioBuffer`, `AudioNode`, object URLs, or decoded sample data in project JSON.
- Preserve `Default Synth` behavior.
- If sampler sustain metadata is invalid or sounds unsafe, fall back to one-shot sample playback instead of producing stuck notes.

## Sampler Metadata Approach

Sample zones may evolve toward this shape:

```ts
export interface SampleZone {
  sampleId: string;
  midiNote: number;
  rootMidiNote: number;
  sampleStartSeconds?: number;
  sampleEndSeconds?: number;
  sustain?: SamplerSustainMeta;
  envelope?: SamplerEnvelopeMeta;
}

export interface SamplerSustainMeta {
  mode: "none" | "forward-loop" | "crossfade-loop";
  loopStartSeconds?: number;
  loopEndSeconds?: number;
  crossfadeSeconds?: number;
}

export interface SamplerEnvelopeMeta {
  attackSeconds?: number;
  releaseSeconds?: number;
}
```

Use these as planning types. The implementation may refine names, but any semantic changes should update `docs/data-model.md`.

## Playback Approach

- Load and decode the required sample before scheduling the note.
- Start playback at `sampleStartSeconds` when present.
- If `sustain.mode` is `none` or loop metadata is missing, play the sample once with the note envelope.
- If `sustain.mode` is `forward-loop`, use `AudioBufferSourceNode.loop`, `loopStart`, and `loopEnd` after validating the region.
- If `sustain.mode` is `crossfade-loop`, implement a simple scheduled crossfade strategy only if it can be done safely in this feature. Otherwise document the limitation and keep `forward-loop` as the first pass.
- Always apply release behavior at the note end so sustained voices do not stay stuck.
- Transport pause and stop must clear active sampler voices.

## Done when

- Sample-based pitched instruments use shared sampler sustain logic instead of Iowa-Piano-only sustain code.
- `Iowa Piano` can use explicit sampler sustain metadata through the shared path.
- Long Iowa Piano notes sustain more smoothly than one-shot playback when valid metadata is present.
- Long notes do not sound like repeated attacks as much as the available sample material allows.
- Invalid or missing loop metadata falls back to one-shot sample playback.
- Note release and transport stop clear sustained sample voices.
- Serializable metadata is documented and runtime audio objects remain runtime-only.
- Relevant docs and tests are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Create short and long Iowa Piano notes.
- Confirm short notes still start at the audible attack.
- Confirm long notes sustain without obvious repeated-strike artifacts when sustain metadata is valid.
- Confirm invalid or missing sustain metadata still plays as one-shot sample playback.
- Stop playback and confirm no sustained sample voice remains stuck.
- Confirm `Default Synth` behavior is unchanged.

## PR notes

- Explain the sampler metadata fields added or changed.
- Explain whether the implementation uses forward looping, crossfaded looping, or a documented fallback.
- List any Iowa Piano samples whose loop metadata still sounds weak.
- Mention manual audio checks and any remaining sample-material limitations.
