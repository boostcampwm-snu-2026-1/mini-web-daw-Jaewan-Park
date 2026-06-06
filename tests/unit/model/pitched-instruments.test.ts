import { describe, expect, it } from "vitest";

import {
  DEFAULT_PITCHED_INSTRUMENT_ID,
  DEFAULT_SYNTH_INSTRUMENT,
  IOWA_PIANO_INSTRUMENT,
  PITCHED_INSTRUMENTS,
  getPitchedInstrument,
  getSampleZoneForMidiNote,
  resolveSustainLoopRegion,
} from "../../../src/model";

describe("pitched instruments", () => {
  it("defines Default Synth and Iowa Piano as serializable metadata", () => {
    expect(DEFAULT_PITCHED_INSTRUMENT_ID).toBe("default-synth");
    expect(PITCHED_INSTRUMENTS).toEqual([
      DEFAULT_SYNTH_INSTRUMENT,
      IOWA_PIANO_INSTRUMENT,
    ]);
    expect(DEFAULT_SYNTH_INSTRUMENT).toEqual({
      id: "default-synth",
      kind: "synth",
      name: "Default Synth",
    });
    expect(IOWA_PIANO_INSTRUMENT).toMatchObject({
      id: "iowa-piano",
      kind: "sample",
      name: "Iowa Piano",
    });
  });

  it("maps Iowa Piano MIDI notes to bundled C4 through C5 sample zones", () => {
    expect(IOWA_PIANO_INSTRUMENT.zones).toHaveLength(13);
    expect(
      getSampleZoneForMidiNote({
        instrument: IOWA_PIANO_INSTRUMENT,
        midiNote: 60,
      }),
    ).toMatchObject({
      midiNote: 60,
      rootMidiNote: 60,
      sampleId: "iowa-piano-c4",
    });
    expect(
      getSampleZoneForMidiNote({
        instrument: IOWA_PIANO_INSTRUMENT,
        midiNote: 72,
      }),
    ).toMatchObject({
      midiNote: 72,
      rootMidiNote: 72,
      sampleId: "iowa-piano-c5",
    });
    expect(
      getSampleZoneForMidiNote({
        instrument: IOWA_PIANO_INSTRUMENT,
        midiNote: 59,
      }),
    ).toBeUndefined();
  });

  it("looks up pitched instruments by ID", () => {
    expect(getPitchedInstrument("default-synth")).toBe(DEFAULT_SYNTH_INSTRUMENT);
    expect(getPitchedInstrument("iowa-piano")).toBe(IOWA_PIANO_INSTRUMENT);
  });

  it("uses sustain loop metadata only when the note duration needs it", () => {
    expect(
      resolveSustainLoopRegion({
        bufferDurationSeconds: 1,
        loopEndSeconds: 0.92,
        loopStartSeconds: 0.28,
        noteDurationSeconds: 0.5,
      }),
    ).toBeNull();

    expect(
      resolveSustainLoopRegion({
        bufferDurationSeconds: 1,
        loopEndSeconds: 0.92,
        loopStartSeconds: 0.28,
        noteDurationSeconds: 1.5,
      }),
    ).toEqual({
      loopEndSeconds: 0.92,
      loopStartSeconds: 0.28,
    });
  });

  it("clamps sustain loop metadata to the decoded buffer duration", () => {
    expect(
      resolveSustainLoopRegion({
        bufferDurationSeconds: 0.5,
        loopEndSeconds: 0.92,
        loopStartSeconds: 0.28,
        noteDurationSeconds: 1.5,
      }),
    ).toEqual({
      loopEndSeconds: 0.5,
      loopStartSeconds: 0.28,
    });
  });
});
