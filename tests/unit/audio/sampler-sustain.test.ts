import { describe, expect, it } from "vitest";

import {
  resolveSamplerEnvelope,
  resolveSamplerLoopRegion,
  resolveSamplerPlaybackPlan,
  resolveSamplerVoiceRelease,
} from "../../../src/audio";
import type { SampleZone } from "../../../src/model";

const validSampleZone: SampleZone = {
  midiNote: 60,
  rootMidiNote: 60,
  sampleId: "test-sample",
  sampleStartSeconds: 0.2,
  sustain: {
    loopEndSeconds: 0.8,
    loopStartSeconds: 0.4,
    mode: "forward-loop",
  },
};

describe("resolveSamplerLoopRegion", () => {
  it("uses valid forward-loop metadata when a note reaches the loop region", () => {
    expect(
      resolveSamplerLoopRegion({
        bufferDurationSeconds: 1,
        noteDurationSeconds: 1.4,
        sampleStartSeconds: 0.2,
        sustain: validSampleZone.sustain,
      }),
    ).toEqual({
      loopEndSeconds: 0.8,
      loopStartSeconds: 0.4,
    });
  });

  it("falls back to one-shot playback when a short note does not reach the loop", () => {
    expect(
      resolveSamplerLoopRegion({
        bufferDurationSeconds: 1,
        noteDurationSeconds: 0.4,
        sampleStartSeconds: 0.2,
        sustain: validSampleZone.sustain,
      }),
    ).toBeNull();
  });

  it("falls back for unsupported or disabled sustain modes", () => {
    expect(
      resolveSamplerLoopRegion({
        bufferDurationSeconds: 1,
        noteDurationSeconds: 2,
        sampleStartSeconds: 0.2,
        sustain: {
          loopEndSeconds: 0.8,
          loopStartSeconds: 0.4,
          mode: "none",
        },
      }),
    ).toBeNull();
    expect(
      resolveSamplerLoopRegion({
        bufferDurationSeconds: 1,
        noteDurationSeconds: 2,
        sampleStartSeconds: 0.2,
        sustain: {
          crossfadeSeconds: 0.02,
          loopEndSeconds: 0.8,
          loopStartSeconds: 0.4,
          mode: "crossfade-loop",
        },
      }),
    ).toBeNull();
  });

  it("rejects invalid loop metadata instead of clamping it into a loop", () => {
    const invalidLoopRegions = [
      { loopEndSeconds: 0.8, loopStartSeconds: 0.1 },
      { loopEndSeconds: 0.4, loopStartSeconds: 0.8 },
      { loopEndSeconds: 1.1, loopStartSeconds: 0.4 },
      { loopEndSeconds: Number.NaN, loopStartSeconds: 0.4 },
      { loopEndSeconds: 0.41, loopStartSeconds: 0.4 },
    ];

    for (const invalidRegion of invalidLoopRegions) {
      expect(
        resolveSamplerLoopRegion({
          bufferDurationSeconds: 1,
          noteDurationSeconds: 2,
          sampleStartSeconds: 0.2,
          sustain: {
            ...invalidRegion,
            mode: "forward-loop",
          },
        }),
      ).toBeNull();
    }
  });
});

describe("resolveSamplerPlaybackPlan", () => {
  it("returns sample offset, envelope, and loop plan for valid sampler metadata", () => {
    const playbackPlan = resolveSamplerPlaybackPlan({
      bufferDurationSeconds: 1,
      noteDurationSeconds: 1.4,
      sampleZone: {
        ...validSampleZone,
        envelope: {
          attackSeconds: 0.02,
          releaseSeconds: 0.12,
        },
      },
    });

    expect(playbackPlan).toMatchObject({
      envelope: {
        attackSeconds: 0.02,
        releaseSeconds: 0.12,
      },
      sampleOffsetSeconds: 0.2,
      sustainLoopRegion: {
        loopEndSeconds: 0.8,
        loopStartSeconds: 0.4,
      },
    });
    expect(playbackPlan.sampleDurationSeconds).toBeUndefined();
  });

  it("uses sampleEndSeconds only when it is inside the decoded buffer", () => {
    expect(
      resolveSamplerPlaybackPlan({
        bufferDurationSeconds: 1,
        noteDurationSeconds: 0.5,
        sampleZone: {
          ...validSampleZone,
          sampleEndSeconds: 0.7,
          sustain: {
            mode: "none",
          },
        },
      }).sampleDurationSeconds,
    ).toBeCloseTo(0.5);

    expect(
      resolveSamplerPlaybackPlan({
        bufferDurationSeconds: 1,
        noteDurationSeconds: 0.5,
        sampleZone: {
          ...validSampleZone,
          sampleEndSeconds: 1.2,
          sustain: {
            mode: "none",
          },
        },
      }).sampleDurationSeconds,
    ).toBeUndefined();
  });
});

describe("resolveSamplerEnvelope", () => {
  it("clamps attack and release for very short notes", () => {
    expect(
      resolveSamplerEnvelope({
        envelope: {
          attackSeconds: 0.2,
          releaseSeconds: 0.2,
        },
        noteDurationSeconds: 0.08,
      }),
    ).toEqual({
      attackSeconds: 0.02,
      releaseSeconds: 0.04,
    });
  });
});

describe("resolveSamplerVoiceRelease", () => {
  it("returns a bounded release stop time for transport cleanup", () => {
    expect(
      resolveSamplerVoiceRelease({
        currentTime: 10,
        releaseSeconds: 0.5,
      }),
    ).toEqual({
      releaseStartTime: 10,
      stopTime: 10.2,
    });
  });
});
