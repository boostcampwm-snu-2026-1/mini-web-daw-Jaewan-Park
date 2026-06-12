import { describe, expect, it } from "vitest";

import {
  DRUM_LANES,
  addNoteEvent,
  addPitchedInstrumentToClip,
  createEmptyHybridClip,
  getDrumStepStartTick,
  hasNoteEventsForPitchedInstrument,
  isDrumStepActive,
  moveDrumLane,
  removePitchedInstrumentFromClip,
  renameClip,
  toggleDrumStep,
  updateDrumLaneSample,
} from "../../../src/model";

describe("drum clip model", () => {
  it("creates an empty 1-bar hybrid clip", () => {
    expect(createEmptyHybridClip()).toMatchObject({
      drumEvents: [],
      drumLanes: DRUM_LANES,
      id: "clip-1",
      lengthTicks: 1920,
      name: "Clip 1",
      noteEvents: [],
      pitchedInstrumentIds: ["default-synth", "iowa-piano"],
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
      clip: createEmptyHybridClip(),
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
