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
  drumEvents: DrumEvent[];
  noteEvents: NoteEvent[];
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
