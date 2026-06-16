import { describe, expect, it } from "vitest";

import {
  DEFAULT_PPQ,
  TICKS_PER_4_4_BAR,
  TICKS_PER_16_STEP,
  TICKS_PER_BEAT,
  audioTimeToTick,
  getSecondsPerTick,
  secondsToTicks,
  tickToAudioTime,
  ticksToSeconds,
} from "../../../src/utils/tick-time";

describe("tick-time utilities", () => {
  it("documents the default 4/4 tick constants", () => {
    expect(DEFAULT_PPQ).toBe(480);
    expect(TICKS_PER_BEAT).toBe(480);
    expect(TICKS_PER_4_4_BAR).toBe(1920);
    expect(TICKS_PER_16_STEP).toBe(120);
  });

  it("converts ticks to seconds at 120 bpm", () => {
    expect(getSecondsPerTick({ tempoBpm: 120 })).toBeCloseTo(0.5 / 480);
    expect(ticksToSeconds(480, { tempoBpm: 120 })).toBeCloseTo(0.5);
    expect(ticksToSeconds(1920, { tempoBpm: 120 })).toBeCloseTo(2);
  });

  it("converts seconds back to ticks", () => {
    expect(secondsToTicks(0.5, { tempoBpm: 120 })).toBeCloseTo(480);
    expect(secondsToTicks(2, { tempoBpm: 120 })).toBeCloseTo(1920);
  });

  it("converts between ticks and audio context time", () => {
    expect(
      tickToAudioTime({
        audioStartTime: 10,
        tick: 960,
        tempoBpm: 120,
      }),
    ).toBeCloseTo(11);
    expect(
      audioTimeToTick({
        audioStartTime: 10,
        audioTime: 11,
        tempoBpm: 120,
      }),
    ).toBeCloseTo(960);
  });

  it("supports a non-zero transport start tick", () => {
    expect(
      tickToAudioTime({
        audioStartTime: 5,
        startTick: 480,
        tick: 960,
        tempoBpm: 120,
      }),
    ).toBeCloseTo(5.5);
  });
});
