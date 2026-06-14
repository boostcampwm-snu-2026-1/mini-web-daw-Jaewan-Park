import { describe, expect, it } from "vitest";

import {
  DRUM_LANES,
  addNoteEvent,
  addPitchedInstrumentToClip,
  createEmptyHybridClip,
  getDrumStepCount,
  getDrumSubstepStartTick,
  getDrumSubstepTicks,
  getDrumStepStartTick,
  getHybridClipLengthTicks,
  hasHybridClipEventsOutsideLength,
  hasNoteEventsForPitchedInstrument,
  isDrumSubstepActive,
  isDrumStepActive,
  moveDrumLane,
  removePitchedInstrumentFromClip,
  renameClip,
  toggleDrumSubstep,
  toggleDrumStep,
  updateDrumLaneSample,
  updateDrumStepSubdivision,
  updateHybridClipLength,
} from "../../../src/model";

describe("drum clip model", () => {
  it("creates an empty 1-bar hybrid clip", () => {
    expect(createEmptyHybridClip()).toMatchObject({
      drumEvents: [],
      drumLanes: DRUM_LANES,
      drumStepSubdivision: 1,
      id: "clip-1",
      lengthTicks: 1920,
      name: "Clip 1",
      noteEvents: [],
      pitchedInstrumentIds: [],
    });
  });

  it("renames clips with non-empty names", () => {
    const clip = createEmptyHybridClip();

    expect(renameClip({ clip, name: "  Verse A  " }).name).toBe("Verse A");
    expect(renameClip({ clip, name: "  " })).toBe(clip);
  });

  it("adds pitched instruments without duplicating existing membership", () => {
    const clip = createEmptyHybridClip({ pitchedInstrumentIds: ["default-synth"] });
    const withPiano = addPitchedInstrumentToClip({
      clip,
      instrumentId: "iowa-piano",
    });

    expect(withPiano.pitchedInstrumentIds).toEqual([
      "default-synth",
      "iowa-piano",
    ]);
    expect(
      addPitchedInstrumentToClip({
        clip: withPiano,
        instrumentId: "iowa-piano",
      }),
    ).toBe(withPiano);
  });

  it("removes pitched instruments and optionally owned notes", () => {
    const clip = addNoteEvent({
      clip: createEmptyHybridClip({
        pitchedInstrumentIds: ["default-synth", "iowa-piano"],
      }),
      durationTicks: 120,
      instrumentId: "iowa-piano",
      midiNote: 60,
      startTick: 0,
    });

    expect(
      hasNoteEventsForPitchedInstrument({
        clip,
        instrumentId: "iowa-piano",
      }),
    ).toBe(true);

    const keptNotes = removePitchedInstrumentFromClip({
      clip,
      instrumentId: "iowa-piano",
    });

    expect(keptNotes.pitchedInstrumentIds).toEqual(["default-synth"]);
    expect(keptNotes.noteEvents).toHaveLength(1);

    const removedNotes = removePitchedInstrumentFromClip({
      clip,
      instrumentId: "iowa-piano",
      removeOwnedNotes: true,
    });

    expect(removedNotes.pitchedInstrumentIds).toEqual(["default-synth"]);
    expect(removedNotes.noteEvents).toEqual([]);
  });

  it("maps 16-step indices to 120-tick positions", () => {
    expect(getDrumStepStartTick(0)).toBe(0);
    expect(getDrumStepStartTick(4)).toBe(480);
    expect(getDrumStepStartTick(15)).toBe(1800);
  });

  it("derives drum step counts from supported clip lengths", () => {
    expect(getHybridClipLengthTicks(1)).toBe(1920);
    expect(getHybridClipLengthTicks(2)).toBe(3840);
    expect(getHybridClipLengthTicks(4)).toBe(7680);
    expect(getDrumStepCount(getHybridClipLengthTicks(1))).toBe(16);
    expect(getDrumStepCount(getHybridClipLengthTicks(2))).toBe(32);
    expect(getDrumStepCount(getHybridClipLengthTicks(4))).toBe(64);
    expect(getDrumStepStartTick(31, getHybridClipLengthTicks(2))).toBe(3720);
  });

  it("maps drum substeps to subdivision tick positions", () => {
    expect(getDrumSubstepTicks(1)).toBe(120);
    expect(getDrumSubstepTicks(2)).toBe(60);
    expect(getDrumSubstepTicks(3)).toBe(40);
    expect(
      getDrumSubstepStartTick({
        stepIndex: 4,
        subdivision: 2,
        substepIndex: 1,
      }),
    ).toBe(540);
    expect(
      getDrumSubstepStartTick({
        stepIndex: 4,
        subdivision: 3,
        substepIndex: 2,
      }),
    ).toBe(560);
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

  it("toggles subdivided drum events at exact tick positions", () => {
    const clip = createEmptyHybridClip({ drumStepSubdivision: 3 });
    const withKick = toggleDrumSubstep({
      clip,
      laneId: "kick",
      stepIndex: 4,
      substepIndex: 2,
    });

    expect(withKick.drumEvents).toEqual([
      {
        id: "clip-1:drum:kick:560",
        laneId: "kick",
        sampleId: "fred-kick-1",
        startTick: 560,
        velocity: 1,
      },
    ]);
    expect(
      isDrumSubstepActive({
        drumEvents: withKick.drumEvents,
        laneId: "kick",
        stepIndex: 4,
        subdivision: 3,
        substepIndex: 2,
      }),
    ).toBe(true);

    const withoutKick = toggleDrumSubstep({
      clip: withKick,
      laneId: "kick",
      stepIndex: 4,
      substepIndex: 2,
    });

    expect(withoutKick.drumEvents).toEqual([]);
  });

  it("toggles drum events in longer clips", () => {
    const clip = updateHybridClipLength({
      clip: createEmptyHybridClip(),
      lengthTicks: getHybridClipLengthTicks(2),
    });
    const withKick = toggleDrumSubstep({
      clip,
      laneId: "kick",
      stepIndex: 20,
      substepIndex: 0,
    });

    expect(withKick.drumEvents[0]).toMatchObject({
      id: "clip-1:drum:kick:2400",
      startTick: 2400,
    });
    expect(
      isDrumSubstepActive({
        clipLengthTicks: clip.lengthTicks,
        drumEvents: withKick.drumEvents,
        laneId: "kick",
        stepIndex: 20,
        subdivision: 1,
        substepIndex: 0,
      }),
    ).toBe(true);
  });

  it("blocks shortening when events would fall outside the new length", () => {
    const longClip = addNoteEvent({
      clip: updateHybridClipLength({
        clip: createEmptyHybridClip(),
        lengthTicks: getHybridClipLengthTicks(2),
      }),
      durationTicks: 240,
      midiNote: 60,
      startTick: 1980,
    });

    expect(
      hasHybridClipEventsOutsideLength({
        clip: longClip,
        lengthTicks: getHybridClipLengthTicks(1),
      }),
    ).toBe(true);
    expect(() =>
      updateHybridClipLength({
        clip: longClip,
        lengthTicks: getHybridClipLengthTicks(1),
      }),
    ).toThrow("Cannot shorten clip");
  });

  it("trims or removes events when shortening is explicitly allowed", () => {
    const longClip = toggleDrumSubstep({
      clip: addNoteEvent({
        clip: addNoteEvent({
          clip: updateHybridClipLength({
            clip: createEmptyHybridClip(),
            lengthTicks: getHybridClipLengthTicks(2),
          }),
          durationTicks: 240,
          midiNote: 60,
          startTick: 1860,
        }),
        durationTicks: 240,
        midiNote: 62,
        startTick: 1980,
      }),
      laneId: "kick",
      stepIndex: 20,
      substepIndex: 0,
    });
    const shortenedClip = updateHybridClipLength({
      clip: longClip,
      lengthTicks: getHybridClipLengthTicks(1),
      trimEvents: true,
    });

    expect(shortenedClip.lengthTicks).toBe(1920);
    expect(shortenedClip.drumEvents).toEqual([]);
    expect(shortenedClip.noteEvents).toEqual([
      expect.objectContaining({
        durationTicks: 60,
        midiNote: 60,
        startTick: 1860,
      }),
    ]);
  });

  it("updates drum step subdivision without rewriting existing events", () => {
    const clip = toggleDrumSubstep({
      clip: createEmptyHybridClip({ drumStepSubdivision: 2 }),
      laneId: "snare",
      stepIndex: 0,
      substepIndex: 1,
    });
    const updatedClip = updateDrumStepSubdivision({
      clip,
      subdivision: 1,
    });

    expect(updatedClip.drumStepSubdivision).toBe(1);
    expect(updatedClip.drumEvents).toEqual(clip.drumEvents);
    expect(isDrumStepActive(updatedClip.drumEvents, "snare", 0)).toBe(false);
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

  it("updates a lane sample and existing events for that lane", () => {
    const clip = toggleDrumStep({
      clip: createEmptyHybridClip(),
      laneId: "kick",
      stepIndex: 0,
    });
    const updatedClip = updateDrumLaneSample({
      clip,
      label: "FRED KICK 2",
      laneId: "kick",
      sampleId: "fred-kick-2",
    });

    expect(updatedClip.drumLanes[0]).toMatchObject({
      id: "kick",
      label: "FRED KICK 2",
      sampleId: "fred-kick-2",
    });
    expect(updatedClip.drumEvents[0]?.sampleId).toBe("fred-kick-2");
  });

  it("moves drum lanes by target index", () => {
    const clip = createEmptyHybridClip();
    const reorderedClip = moveDrumLane({
      clip,
      laneId: "openHat",
      targetIndex: 1,
    });

    expect(reorderedClip.drumLanes.map((lane) => lane.id)).toEqual([
      "kick",
      "openHat",
      "snare",
      "closedHat",
    ]);
  });
});
