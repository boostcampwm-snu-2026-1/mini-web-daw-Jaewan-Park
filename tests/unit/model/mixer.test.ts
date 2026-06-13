import { describe, expect, it } from "vitest";

import {
  MIXER_DEFAULT_VOLUME_DB,
  MIXER_MAX_VOLUME_DB,
  MIXER_MIN_VOLUME_DB,
  clampMixerVolumeDb,
  createDefaultMasterMixerState,
  createDefaultTrackMixerState,
  createDefaultTrackMixerStates,
  decibelsToLinearGain,
  getTrackEffectiveGain,
  getTrackMixerState,
  isTrackMixerAudible,
  updateMasterMixerState,
  updateTrackMixerState,
} from "../../../src/model";

describe("mixer model", () => {
  it("creates serializable default mixer states", () => {
    expect(createDefaultTrackMixerState("track-1")).toEqual({
      muted: false,
      solo: false,
      trackId: "track-1",
      volumeDb: MIXER_DEFAULT_VOLUME_DB,
    });
    expect(
      createDefaultTrackMixerStates([
        { id: "track-1", name: "Track 1" },
        { id: "track-2", name: "Track 2" },
      ]),
    ).toEqual([
      {
        muted: false,
        solo: false,
        trackId: "track-1",
        volumeDb: 0,
      },
      {
        muted: false,
        solo: false,
        trackId: "track-2",
        volumeDb: 0,
      },
    ]);
    expect(createDefaultMasterMixerState()).toEqual({ volumeDb: 0 });
  });

  it("clamps fader values and converts decibels to linear gain", () => {
    expect(clampMixerVolumeDb(-120)).toBe(MIXER_MIN_VOLUME_DB);
    expect(clampMixerVolumeDb(12)).toBe(MIXER_MAX_VOLUME_DB);
    expect(clampMixerVolumeDb(Number.NaN)).toBe(MIXER_DEFAULT_VOLUME_DB);
    expect(decibelsToLinearGain(MIXER_MIN_VOLUME_DB)).toBe(0);
    expect(decibelsToLinearGain(0)).toBe(1);
    expect(decibelsToLinearGain(6)).toBeCloseTo(1.995, 3);
  });

  it("updates track and master mixer state without mutating existing state", () => {
    const initialStates = [createDefaultTrackMixerState("track-1")];
    const nextStates = updateTrackMixerState(initialStates, "track-1", {
      muted: true,
      volumeDb: -12,
    });

    expect(initialStates[0]).toEqual(createDefaultTrackMixerState("track-1"));
    expect(nextStates[0]).toMatchObject({
      muted: true,
      trackId: "track-1",
      volumeDb: -12,
    });
    expect(
      updateTrackMixerState([], "track-2", {
        solo: true,
        volumeDb: 99,
      }),
    ).toEqual([
      {
        muted: false,
        solo: true,
        trackId: "track-2",
        volumeDb: MIXER_MAX_VOLUME_DB,
      },
    ]);
    expect(
      updateMasterMixerState(createDefaultMasterMixerState(), { volumeDb: -99 }),
    ).toEqual({ volumeDb: MIXER_MIN_VOLUME_DB });
  });

  it("uses deterministic mute and solo audibility rules", () => {
    const trackOne = {
      ...createDefaultTrackMixerState("track-1"),
      solo: true,
    };
    const trackTwo = createDefaultTrackMixerState("track-2");
    const mutedSolo = {
      ...createDefaultTrackMixerState("track-3"),
      muted: true,
      solo: true,
    };
    const allTrackStates = [trackOne, trackTwo, mutedSolo];

    expect(
      isTrackMixerAudible({
        allTrackStates,
        trackState: trackOne,
      }),
    ).toBe(true);
    expect(
      isTrackMixerAudible({
        allTrackStates,
        trackState: trackTwo,
      }),
    ).toBe(false);
    expect(
      isTrackMixerAudible({
        allTrackStates,
        trackState: mutedSolo,
      }),
    ).toBe(false);
    expect(
      getTrackEffectiveGain({
        allTrackStates,
        trackState: mutedSolo,
      }),
    ).toBe(0);
  });

  it("returns a default track mixer state for missing tracks", () => {
    expect(getTrackMixerState([], "track-99")).toEqual(
      createDefaultTrackMixerState("track-99"),
    );
  });
});
