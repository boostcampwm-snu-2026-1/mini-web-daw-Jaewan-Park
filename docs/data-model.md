# Data Model

## Tick-based Time Model

Store musical time in ticks, not seconds. The recommended default PPQ is 480 pulses per quarter note.

For 4/4:

- 1 beat = 480 ticks.
- 1 bar = 1920 ticks.
- 16-step grid step = 120 ticks.

Seconds are derived at playback time from ticks and tempo. Do not store seconds as the primary event position.

## Core Entities

- `Project`: top-level serializable project document.
- `Track`: a lane that can contain clip instances.
- `Clip`: reusable musical content.
- `ClipInstance`: placement of a clip on a track in arrangement time.
- `DrumEvent`: drum hit inside a clip.
- `NoteEvent`: pitched note inside a clip.
- `SampleMeta`: serializable metadata for a sample.

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

The initial piano roll uses the University of Iowa piano sample set under:

```text
public/samples/pitched_instruments/University_of_Iowa_piano/
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

Sample IDs use the stable prefix `university-of-iowa-piano-` plus the lowercased pitch name, for example:

- `C4.wav` -> `university-of-iowa-piano-c4`
- `Db4.wav` -> `university-of-iowa-piano-db4`

The first piano roll implementation uses these files to define the initial C4-C5 pitch range and to keep bundled sample metadata available. Held-note playback uses a basic synth oscillator so note duration can be controlled in ticks without depending on sample length. A future sampler instrument can use these sample IDs and paths for sample-based pitched playback.

## Initial Piano Roll Implementation

The initial piano roll stores note events directly in the selected hybrid clip's `noteEvents` array. Notes are serializable data:

- `midiNote`: MIDI note number, initially C4 through C5.
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
```

## Runtime-only Audio Data

`AudioBuffer` and decoded sample data are runtime-only. Project files should reference samples by stable IDs, paths, or metadata. They must not embed `AudioBuffer`, `AudioNode`, object URLs, or decoded sample contents.

Use a runtime sample cache keyed by `sampleId` when playback needs decoded audio.
