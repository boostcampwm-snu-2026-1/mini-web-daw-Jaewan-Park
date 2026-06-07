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
  envelope?: SamplerEnvelopeMeta;
  midiNote: number;
  rootMidiNote: number;
  sampleEndSeconds?: number;
  sampleStartSeconds?: number;
  sampleId: string;
  sustain?: SamplerSustainMeta;
}

export interface SamplerSustainMeta {
  crossfadeSeconds?: number;
  loopEndSeconds?: number;
  loopStartSeconds?: number;
  mode: "crossfade-loop" | "forward-loop" | "none";
}

export interface SamplerEnvelopeMeta {
  attackSeconds?: number;
  releaseSeconds?: number;
}

const IOWA_PIANO_SAMPLE_START_SECONDS: Readonly<Record<number, number>> = {
  60: 0.525,
  61: 0.562,
  62: 0.699,
  63: 0.574,
  64: 0.678,
  65: 0.597,
  66: 0.393,
  67: 0.67,
  68: 0.526,
  69: 0.26,
  70: 0.44,
  71: 0.474,
  72: 0.219,
};
const IOWA_PIANO_LOOP_START_SECONDS = 0.88;
const IOWA_PIANO_LOOP_END_SECONDS = 0.98;
const IOWA_PIANO_ENVELOPE = {
  attackSeconds: 0.012,
  releaseSeconds: 0.09,
} as const satisfies SamplerEnvelopeMeta;

export const DEFAULT_SYNTH_INSTRUMENT = {
  id: "default-synth",
  kind: "synth",
  name: "Default Synth",
} as const satisfies PitchedInstrumentMeta;

export const IOWA_PIANO_INSTRUMENT = {
  id: "iowa-piano",
  kind: "sample",
  name: "Iowa Piano",
  zones: PIANO_ROLL_PITCHES.map((pitch) => {
    const sampleStartSeconds =
      IOWA_PIANO_SAMPLE_START_SECONDS[pitch.midiNote] ?? 0;

    return {
      envelope: IOWA_PIANO_ENVELOPE,
      midiNote: pitch.midiNote,
      rootMidiNote: pitch.midiNote,
      sampleStartSeconds,
      sampleId: pitch.sampleId,
      sustain: {
        loopEndSeconds: IOWA_PIANO_LOOP_END_SECONDS,
        loopStartSeconds: IOWA_PIANO_LOOP_START_SECONDS,
        mode: "forward-loop",
      },
    };
  }),
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
