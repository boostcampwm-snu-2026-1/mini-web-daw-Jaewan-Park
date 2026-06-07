# Data Model

## Tick-based Time Model

Store musical time in ticks, not seconds. The recommended default PPQ is 480 pulses per quarter note.

For 4/4:

- 1 beat = 480 ticks.
- 1 bar = 1920 ticks.
- 16-step grid step = 120 ticks.

Seconds are derived at playback time from ticks and tempo. Do not store seconds as the primary event position.

## Tempo

Project tempo should be represented as serializable BPM data, using a field such as `tempoBpm` on the project or current app-level project state until full persistence exists.

Changing tempo must not rewrite clip event positions. Drum events and note events keep their `startTick` and `durationTicks`; the audio engine converts those ticks to seconds using the current `tempoBpm` at scheduling time.

The initial transport UI range is 60 to 180 BPM. Implementations should validate or clamp tempo values before passing them to scheduler or tick/time conversion utilities.

## Core Entities

- `Project`: top-level serializable project document.
- `Track`: a lane that can contain clip instances.
- `Clip`: reusable musical content.
- `ClipInstance`: placement of a clip on a track in arrangement time.
- `DrumEvent`: drum hit inside a clip.
- `NoteEvent`: pitched note inside a clip.
- `SampleMeta`: serializable metadata for a sample.
- `PitchedInstrumentMeta`: serializable metadata for a pitched instrument.

## Hybrid Clips

Early clips may contain both drum events and note events. This keeps the M1 editor focused: one 1-bar clip can hold a drum pattern and a piano roll phrase.

Later, the model can evolve toward separate drum, MIDI, and audio clip types if arrangement and editing workflows need stronger separation.

## Bundled Drum Sample Naming and Display

Bundled drum sample files live under `public/samples/drums/`.

Use descriptive `.wav` file names with words separated by underscores, for example:

```text
Fred_Kick_1.wav
Fred_Closed_Hi-Hat.wav
```

The app derives sample metadata from the file name:

- Sample IDs are the file stem lowercased with underscores replaced by hyphens.
- Display names remove `.wav`, replace underscores with spaces, and uppercase the result.

Examples:

- `Fred_Kick_1.wav` -> sample ID `fred-kick-1`, display name `FRED KICK 1`.
- `Fred_Closed_Hi-Hat.wav` -> sample ID `fred-closed-hi-hat`, display name `FRED CLOSED HI-HAT`.

## Initial Drum Clip Implementation

The initial drum step sequencer stores lane settings and drum hits in the selected hybrid clip. A 16-step grid maps step indices to ticks with `stepIndex * 120`.

The clip stores `drumLanes` as an ordered array. That array controls both visual lane order and the current sample assigned to each lane. Reordering lanes or changing a lane's sample must update serializable clip state, not runtime-only audio state.

Initial drum lanes map to bundled sample IDs:

- `kick` -> `fred-kick-1`
- `snare` -> `fred-snare-1`
- `closedHat` -> `fred-closed-hi-hat`
- `openHat` -> `fred-open-hi-hat`

Drum event IDs are deterministic within a clip using the clip ID, lane ID, and start tick. Runtime playback converts these serializable events into audio engine sample loop events; the project model itself does not store `AudioBuffer` or other Web Audio objects.

When a lane sample changes, existing `DrumEvent` objects for that lane should be updated to the new `sampleId` so playback and project export reflect the visible lane setting.

## Bundled Piano Sample Naming and Display

Bundled pitched instrument samples may live under `public/samples/pitched_instruments/`.

The initial piano roll uses the Iowa Piano sample set under:

```text
public/samples/pitched_instruments/Iowa_Piano/
```

The initial bundled files cover C4 through C5:

```text
C4.wav
Db4.wav
D4.wav
Eb4.wav
E4.wav
F4.wav
Gb4.wav
G4.wav
Ab4.wav
A4.wav
Bb4.wav
B4.wav
C5.wav
```

Sample IDs use the stable prefix `iowa-piano-` plus the lowercased pitch name, for example:

- `C4.wav` -> `iowa-piano-c4`
- `Db4.wav` -> `iowa-piano-db4`

The piano roll uses these files to define the initial C4-C5 pitch range and keep bundled sample metadata available. `Default Synth` remains the oscillator-based fallback instrument, while `Iowa Piano` uses the bundled WAV files for sample-based note playback.

## Pitched Instruments

Pitched instrument selection should distinguish the sound source used for `NoteEvent` playback from the notes themselves.

Initial pitched instrument IDs:

- `default-synth`: oscillator-based playback. It can hold notes for arbitrary durations.
- `iowa-piano`: sample-based playback using bundled Iowa Piano WAV files.

Instrument selection may start as selected-clip or runtime UI state during early M1 work. If it becomes part of saved project behavior, store only serializable IDs and metadata, not runtime audio objects.

Each `NoteEvent` stores the serializable `instrumentId` that owns that note. This allows multiple pitched instruments, such as `Default Synth` and `Iowa Piano`, to have notes at the same tick and pitch inside one hybrid clip and play simultaneously.

Iowa Piano can use sample zones to map MIDI notes to bundled samples and optional sustain loop metadata:

```ts
export interface PitchedInstrumentMeta {
  id: "default-synth" | "iowa-piano" | string;
  name: string;
  kind: "synth" | "sample";
  zones?: SampleZone[];
}

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

The `sustain` fields are serializable metadata. They describe how the runtime audio engine may configure sample sustain playback. A simple `forward-loop` mode may map to `AudioBufferSourceNode.loopStart` and `loopEnd`; a future `crossfade-loop` mode may require additional scheduled source nodes and gain ramps.

The `sampleStartSeconds` field skips leading silence before note attack. `sampleEndSeconds`, sustain loop points, crossfade length, and envelope values are sample-local seconds because they describe positions or durations inside a sample, not musical event time.

Current Iowa Piano sample zones include explicit `forward-loop` sustain metadata and basic envelope metadata. The loop points use a late tail region to avoid repeating the audible note attack. These fields are still serializable sample-zone data only. The runtime audio engine validates them against decoded buffer duration and note duration before enabling `AudioBufferSourceNode.loop`; invalid or unsupported metadata falls back to one-shot sample playback.

## Initial Piano Roll Implementation

The initial piano roll stores note events directly in the selected hybrid clip's `noteEvents` array. Notes are serializable data:

- `midiNote`: MIDI note number, initially C4 through C5.
- `instrumentId`: pitched instrument that owns and plays the note.
- `startTick`: note start position inside the clip.
- `durationTicks`: note length.
- `velocity`: normalized gain from 0 to 1.

The initial visual piano roll grid has 32 columns across the 1-bar clip. At PPQ 480, one bar is 1920 ticks, so one piano roll grid column is 60 ticks. Drum sequencing still uses the 16-step grid where each step is 120 ticks.

The UI may allow left-click or drag creation, dragging existing notes to move pitch/time, and right-click deletion. These interactions must update `noteEvents` in serializable clip state. Runtime audio objects used for synth playback or sample decoding must stay outside project JSON.

## Illustrative Types

These snippets show model intent. Implementation may refine names and fields, but changes to model semantics must update this document.

```ts
export type Tick = number;

export interface Project {
  id: string;
  version: number;
  name: string;
  tempoBpm: number;
  timeSignature: {
    numerator: 4;
    denominator: 4;
  };
  ppq: 480;
  tracks: Track[];
  clips: Clip[];
  samples: SampleMeta[];
  instruments?: PitchedInstrumentMeta[];
}

export interface Track {
  id: string;
  name: string;
  kind: "hybrid" | "drum" | "instrument" | "audio";
  clipInstances: ClipInstance[];
}

export interface Clip {
  id: string;
  name: string;
  lengthTicks: Tick;
  drumLanes: DrumLaneDefinition[];
  drumEvents: DrumEvent[];
  noteEvents: NoteEvent[];
}

export interface DrumLaneDefinition {
  id: "kick" | "snare" | "closedHat" | "openHat";
  label: string;
  sampleId: string;
}

export interface ClipInstance {
  id: string;
  clipId: string;
  trackId: string;
  startTick: Tick;
  lengthTicks: Tick;
}

export interface DrumEvent {
  id: string;
  laneId: "kick" | "snare" | "closedHat" | "openHat" | string;
  startTick: Tick;
  velocity: number;
  sampleId: string;
}

export interface NoteEvent {
  id: string;
  instrumentId: "default-synth" | "iowa-piano" | string;
  midiNote: number;
  startTick: Tick;
  durationTicks: Tick;
  velocity: number;
}

export interface SampleMeta {
  id: string;
  name: string;
  source: {
    kind: "bundled" | "imported";
    path?: string;
    fileName?: string;
    mimeType?: string;
  };
}

export interface PitchedInstrumentMeta {
  id: "default-synth" | "iowa-piano" | string;
  name: string;
  kind: "synth" | "sample";
  zones?: SampleZone[];
}

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

## Runtime-only Audio Data

`AudioBuffer` and decoded sample data are runtime-only. Project files should reference samples by stable IDs, paths, or metadata. They must not embed `AudioBuffer`, `AudioNode`, object URLs, or decoded sample contents.

Use a runtime sample cache keyed by `sampleId` when playback needs decoded audio.
