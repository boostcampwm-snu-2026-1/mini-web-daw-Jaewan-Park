import { describe, expect, it } from "vitest";

import {
  DRUM_LANES,
  createEmptyHybridClip,
  getDrumStepStartTick,
  isDrumStepActive,
  toggleDrumStep,
} from "../../../src/model";

describe("drum clip model", () => {
  it("creates an empty 1-bar hybrid clip", () => {
    expect(createEmptyHybridClip()).toMatchObject({
      drumEvents: [],
      id: "clip-1",
      lengthTicks: 1920,
      name: "Clip 1",
      noteEvents: [],
    });
  });

  it("maps 16-step indices to 120-tick positions", () => {
    expect(getDrumStepStartTick(0)).toBe(0);
    expect(getDrumStepStartTick(4)).toBe(480);
    expect(getDrumStepStartTick(15)).toBe(1800);
  });

  it("toggles a step into a serializable drum event and removes it", () => {
    const clip = createEmptyHybridClip();
    const withKick = toggleDrumStep({
      clip,
      laneId: "kick",
      stepIndex: 4,
    });

    expect(withKick.drumEvents).toEqual([
      {
        id: "clip-1:drum:kick:480",
        laneId: "kick",
        sampleId: "fred-kick-1",
        startTick: 480,
        velocity: 1,
      },
    ]);
    expect(isDrumStepActive(withKick.drumEvents, "kick", 4)).toBe(true);

    const withoutKick = toggleDrumStep({
      clip: withKick,
      laneId: "kick",
      stepIndex: 4,
    });

    expect(withoutKick.drumEvents).toEqual([]);
  });

  it("keeps drum events sorted by tick and lane order", () => {
    const clip = createEmptyHybridClip();
    const withSnare = toggleDrumStep({
      clip,
      laneId: "snare",
      stepIndex: 1,
    });
    const withKick = toggleDrumStep({
      clip: withSnare,
      laneId: "kick",
      stepIndex: 1,
    });
    const withHat = toggleDrumStep({
      clip: withKick,
      laneId: "closedHat",
      stepIndex: 0,
    });

    expect(
      withHat.drumEvents.map((event) => [event.startTick, event.laneId]),
    ).toEqual([
      [0, "closedHat"],
      [120, "kick"],
      [120, "snare"],
    ]);
  });

  it("defines the four initial drum lanes with Fred sample IDs and labels", () => {
    expect(DRUM_LANES.map((lane) => [lane.id, lane.sampleId, lane.label])).toEqual([
      ["kick", "fred-kick-1", "FRED KICK 1"],
      ["snare", "fred-snare-1", "FRED SNARE 1"],
      ["closedHat", "fred-closed-hi-hat", "FRED CLOSED HI-HAT"],
      ["openHat", "fred-open-hi-hat", "FRED OPEN HI-HAT"],
    ]);
  });
});
