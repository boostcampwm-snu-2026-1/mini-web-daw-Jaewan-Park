import { describe, expect, it } from "vitest";

import {
  DEFAULT_PITCHED_INSTRUMENT_ID,
  DEFAULT_SYNTH_INSTRUMENT,
  IOWA_PIANO_INSTRUMENT,
  PITCHED_INSTRUMENTS,
  getPitchedInstrument,
  getSampleZoneForMidiNote,
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
      envelope: {
        attackSeconds: 0.012,
        releaseSeconds: 0.09,
      },
      midiNote: 60,
      rootMidiNote: 60,
      sampleStartSeconds: 0.525,
      sampleId: "iowa-piano-c4",
      sustain: {
        mode: "forward-loop",
      },
    });
    expect(c4Zone?.sustain?.loopStartSeconds).toBeCloseTo(0.705);
    expect(c4Zone?.sustain?.loopEndSeconds).toBeCloseTo(0.96);
    expect(c4Zone).not.toHaveProperty("loopEndSeconds");
    expect(c4Zone).not.toHaveProperty("loopStartSeconds");
    expect(c5Zone).toMatchObject({
      midiNote: 72,
      rootMidiNote: 72,
      sampleStartSeconds: 0.219,
      sampleId: "iowa-piano-c5",
      sustain: {
        mode: "forward-loop",
      },
    });
    expect(c5Zone?.sustain?.loopStartSeconds).toBeCloseTo(0.399);
    expect(c5Zone?.sustain?.loopEndSeconds).toBeCloseTo(0.96);
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

  it("keeps pitched instrument metadata JSON serializable", () => {
    expect(JSON.parse(JSON.stringify(IOWA_PIANO_INSTRUMENT))).toEqual(
      IOWA_PIANO_INSTRUMENT,
    );
  });
});
