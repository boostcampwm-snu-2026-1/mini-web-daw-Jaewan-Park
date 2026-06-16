import { describe, expect, it } from "vitest";

import {
  DEFAULT_TEMPO_BPM,
  MAX_TEMPO_BPM,
  MIN_TEMPO_BPM,
  clampTempoBpm,
} from "../../../src/utils";

describe("tempo utilities", () => {
  it("clamps tempo to the supported transport range", () => {
    expect(clampTempoBpm(40)).toBe(MIN_TEMPO_BPM);
    expect(clampTempoBpm(250)).toBe(MAX_TEMPO_BPM);
    expect(clampTempoBpm(127.6)).toBe(128);
  });

  it("falls back to the default tempo for non-finite values", () => {
    expect(clampTempoBpm(Number.NaN)).toBe(DEFAULT_TEMPO_BPM);
    expect(clampTempoBpm(Number.POSITIVE_INFINITY)).toBe(DEFAULT_TEMPO_BPM);
  });
});
