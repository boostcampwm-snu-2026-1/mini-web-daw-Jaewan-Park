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
    const c4Zone = getSampleZoneForMidiNote({
      instrument: IOWA_PIANO_INSTRUMENT,
      midiNote: 60,
    });
    const c5Zone = getSampleZoneForMidiNote({
      instrument: IOWA_PIANO_INSTRUMENT,
      midiNote: 72,
    });

    expect(c4Zone).toMatchObject({
      midiNote: 60,
      rootMidiNote: 60,
      sampleStartSeconds: 0.525,
      sampleId: "iowa-piano-c4",
    });
    expect(c4Zone).not.toHaveProperty("loopEndSeconds");
    expect(c4Zone).not.toHaveProperty("loopStartSeconds");
    expect(c5Zone).toMatchObject({
      midiNote: 72,
      rootMidiNote: 72,
      sampleStartSeconds: 0.219,
      sampleId: "iowa-piano-c5",
    });
    expect(c5Zone).not.toHaveProperty("loopEndSeconds");
    expect(c5Zone).not.toHaveProperty("loopStartSeconds");
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
        loopEndSeconds: 0.96,
        loopStartSeconds: 0.605,
        noteDurationSeconds: 0.3,
        sampleStartSeconds: 0.525,
      }),
    ).toBeNull();

    expect(
      resolveSustainLoopRegion({
        bufferDurationSeconds: 1,
        loopEndSeconds: 0.96,
        loopStartSeconds: 0.605,
        noteDurationSeconds: 1.5,
        sampleStartSeconds: 0.525,
      }),
    ).toEqual({
      loopEndSeconds: 0.96,
      loopStartSeconds: 0.605,
    });
  });

  it("clamps sustain loop metadata to the decoded buffer duration", () => {
    expect(
      resolveSustainLoopRegion({
        bufferDurationSeconds: 0.7,
        loopEndSeconds: 0.96,
        loopStartSeconds: 0.605,
        noteDurationSeconds: 1.5,
        sampleStartSeconds: 0.525,
      }),
    ).toEqual({
      loopEndSeconds: 0.7,
      loopStartSeconds: 0.605,
    });
  });
});
