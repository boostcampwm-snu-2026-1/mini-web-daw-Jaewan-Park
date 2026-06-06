import { describe, expect, it } from "vitest";

import {
  BUNDLED_DRUM_SAMPLES,
  BUNDLED_PIANO_SAMPLES,
  BUNDLED_SAMPLES,
  getBundledSampleDisplayName,
} from "../../../src/audio/bundled-samples";

describe("bundled samples", () => {
  it("uses unique sample IDs", () => {
    const ids = BUNDLED_SAMPLES.map((sample) => sample.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points to bundled Fred wav files under the public samples directory", () => {
    expect(BUNDLED_DRUM_SAMPLES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "fred-kick-1",
          name: "FRED KICK 1",
          path: "/samples/drums/Fred_Kick_1.wav",
        }),
        expect.objectContaining({
          id: "fred-snare-1",
          name: "FRED SNARE 1",
          path: "/samples/drums/Fred_Snare_1.wav",
        }),
        expect.objectContaining({
          id: "fred-closed-hi-hat",
          name: "FRED CLOSED HI-HAT",
          path: "/samples/drums/Fred_Closed_Hi-Hat.wav",
        }),
        expect.objectContaining({
          id: "fred-open-hi-hat",
          name: "FRED OPEN HI-HAT",
          path: "/samples/drums/Fred_Open_Hi-Hat.wav",
        }),
      ]),
    );

    for (const sample of BUNDLED_DRUM_SAMPLES) {
      expect(sample.path).toMatch(/^\/samples\/drums\/.+\.wav$/);
    }
  });

  it("formats display names from wav file names", () => {
    expect(
      getBundledSampleDisplayName("/samples/drums/Fred_Closed_Hi-Hat.wav"),
    ).toBe("FRED CLOSED HI-HAT");
  });

  it("points to the bundled University of Iowa piano C4-C5 wav files", () => {
    expect(BUNDLED_PIANO_SAMPLES).toHaveLength(13);
    expect(BUNDLED_PIANO_SAMPLES[0]).toEqual({
      id: "university-of-iowa-piano-c4",
      name: "UNIVERSITY OF IOWA PIANO C4",
      path: "/samples/pitched_instruments/University_of_Iowa_piano/C4.wav",
    });
    expect(BUNDLED_PIANO_SAMPLES.at(-1)).toEqual({
      id: "university-of-iowa-piano-c5",
      name: "UNIVERSITY OF IOWA PIANO C5",
      path: "/samples/pitched_instruments/University_of_Iowa_piano/C5.wav",
    });

    for (const sample of BUNDLED_PIANO_SAMPLES) {
      expect(sample.path).toMatch(
        /^\/samples\/pitched_instruments\/University_of_Iowa_piano\/.+\.wav$/,
      );
    }
  });
});
