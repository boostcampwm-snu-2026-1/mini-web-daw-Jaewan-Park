import {
  PIANO_ROLL_PITCHES,
  type PitchedInstrumentId,
} from "./drum-clip";

export { DEFAULT_PITCHED_INSTRUMENT_ID } from "./drum-clip";
export type { PitchedInstrumentId } from "./drum-clip";

export interface PitchedInstrumentMeta {
  id: PitchedInstrumentId;
  kind: "sample" | "synth";
  name: string;
  zones?: readonly SampleZone[];
}

export interface SampleZone {
  loopEndSeconds?: number;
  loopStartSeconds?: number;
  midiNote: number;
  rootMidiNote: number;
  sampleId: string;
}

export interface SustainLoopRegion {
  loopEndSeconds: number;
  loopStartSeconds: number;
}

interface ResolveSustainLoopOptions {
  bufferDurationSeconds: number;
  loopEndSeconds?: number;
  loopStartSeconds?: number;
  minimumLoopDurationSeconds?: number;
  noteDurationSeconds: number;
}

const IOWA_PIANO_LOOP_START_SECONDS = 0.28;
const IOWA_PIANO_LOOP_END_SECONDS = 0.92;
const DEFAULT_MINIMUM_LOOP_DURATION_SECONDS = 0.04;

export const DEFAULT_SYNTH_INSTRUMENT = {
  id: "default-synth",
  kind: "synth",
  name: "Default Synth",
} as const satisfies PitchedInstrumentMeta;

export const IOWA_PIANO_INSTRUMENT = {
  id: "iowa-piano",
  kind: "sample",
  name: "Iowa Piano",
  zones: PIANO_ROLL_PITCHES.map((pitch) => ({
    loopEndSeconds: IOWA_PIANO_LOOP_END_SECONDS,
    loopStartSeconds: IOWA_PIANO_LOOP_START_SECONDS,
    midiNote: pitch.midiNote,
    rootMidiNote: pitch.midiNote,
    sampleId: pitch.sampleId,
  })),
} as const satisfies PitchedInstrumentMeta;

export const PITCHED_INSTRUMENTS = [
  DEFAULT_SYNTH_INSTRUMENT,
  IOWA_PIANO_INSTRUMENT,
] as const satisfies readonly PitchedInstrumentMeta[];

export function getPitchedInstrument(
  instrumentId: PitchedInstrumentId,
): PitchedInstrumentMeta {
  const instrument = PITCHED_INSTRUMENTS.find(
    (candidate) => candidate.id === instrumentId,
  );

  if (!instrument) {
    throw new Error(`Unknown pitched instrument ID: ${instrumentId}`);
  }

  return instrument;
}

export function getSampleZoneForMidiNote({
  instrument,
  midiNote,
}: {
  instrument: PitchedInstrumentMeta;
  midiNote: number;
}): SampleZone | undefined {
  return instrument.zones?.find((zone) => zone.midiNote === midiNote);
}

export function resolveSustainLoopRegion({
  bufferDurationSeconds,
  loopEndSeconds,
  loopStartSeconds,
  minimumLoopDurationSeconds = DEFAULT_MINIMUM_LOOP_DURATION_SECONDS,
  noteDurationSeconds,
}: ResolveSustainLoopOptions): SustainLoopRegion | null {
  if (
    loopStartSeconds === undefined ||
    loopEndSeconds === undefined ||
    bufferDurationSeconds <= minimumLoopDurationSeconds
  ) {
    return null;
  }

  const loopStart = clamp(
    loopStartSeconds,
    0,
    bufferDurationSeconds - minimumLoopDurationSeconds,
  );
  const loopEnd = clamp(
    loopEndSeconds,
    loopStart + minimumLoopDurationSeconds,
    bufferDurationSeconds,
  );

  if (loopEnd - loopStart < minimumLoopDurationSeconds) {
    return null;
  }

  if (noteDurationSeconds <= loopEnd) {
    return null;
  }

  return {
    loopEndSeconds: loopEnd,
    loopStartSeconds: loopStart,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
