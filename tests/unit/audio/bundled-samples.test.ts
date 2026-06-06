import { describe, expect, it } from "vitest";

import {
  BUNDLED_DRUM_SAMPLES,
  getBundledSampleDisplayName,
} from "../../../src/audio/bundled-samples";

describe("BUNDLED_DRUM_SAMPLES", () => {
  it("uses unique sample IDs", () => {
    const ids = BUNDLED_DRUM_SAMPLES.map((sample) => sample.id);

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
          id: "fred-closed-hi-hat-1",
          name: "FRED CLOSED HI-HAT 1",
          path: "/samples/drums/Fred_Closed_Hi-Hat_1.wav",
        }),
        expect.objectContaining({
          id: "fred-open-hi-hat-1",
          name: "FRED OPEN HI-HAT 1",
          path: "/samples/drums/Fred_Open_Hi-Hat_1.wav",
        }),
      ]),
    );

    for (const sample of BUNDLED_DRUM_SAMPLES) {
      expect(sample.path).toMatch(/^\/samples\/drums\/.+\.wav$/);
    }
  });

  it("formats display names from wav file names", () => {
    expect(
      getBundledSampleDisplayName("/samples/drums/Fred_Closed_Hi-Hat_1.wav"),
    ).toBe("FRED CLOSED HI-HAT 1");
  });
});
