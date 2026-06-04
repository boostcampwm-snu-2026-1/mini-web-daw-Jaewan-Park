import { describe, expect, it } from "vitest";

import { BUNDLED_DRUM_SAMPLES } from "../../../src/audio/bundled-samples";

describe("BUNDLED_DRUM_SAMPLES", () => {
  it("uses unique sample IDs", () => {
    const ids = BUNDLED_DRUM_SAMPLES.map((sample) => sample.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points to bundled wav files under the public samples directory", () => {
    expect(BUNDLED_DRUM_SAMPLES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "kick" }),
        expect.objectContaining({ id: "snare" }),
        expect.objectContaining({ id: "closed-hat" }),
        expect.objectContaining({ id: "open-hat" }),
      ]),
    );

    for (const sample of BUNDLED_DRUM_SAMPLES) {
      expect(sample.path).toMatch(/^\/samples\/drums\/.+\.wav$/);
    }
  });
});
