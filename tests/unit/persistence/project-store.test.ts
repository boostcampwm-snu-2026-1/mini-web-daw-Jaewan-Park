import { describe, expect, it } from "vitest";

import {
  ACTIVE_PROJECT_ID,
  PROJECT_DOCUMENT_VERSION,
  createPersistedProjectDocument,
  getImportedSampleIds,
  migratePersistedProjectDocument,
} from "../../../src/persistence";
import {
  createDefaultArrangementLoopRange,
  createDefaultArrangementTracks,
  createDefaultMasterMixerState,
  createDefaultTrackMixerStates,
  createEmptyHybridClip,
  createImportedAudioClipDraft,
} from "../../../src/model";

describe("project persistence document helpers", () => {
  it("creates a versioned serializable active project document", () => {
    const tracks = createDefaultArrangementTracks(2);
    const document = createPersistedProjectDocument({
      arrangementLengthBars: 16,
      arrangementLoopRange: createDefaultArrangementLoopRange(),
      arrangementTracks: tracks,
      clipInstances: [],
      clips: [createEmptyHybridClip({ id: "clip-1" })],
      masterMixerState: createDefaultMasterMixerState(),
      name: "Project 1",
      sampleMetas: [],
      savedAt: 123,
      tempoBpm: 128,
      trackMixerStates: createDefaultTrackMixerStates(tracks),
    });

    expect(document).toMatchObject({
      arrangementLengthBars: 16,
      id: ACTIVE_PROJECT_ID,
      name: "Project 1",
      savedAt: 123,
      tempoBpm: 128,
      version: PROJECT_DOCUMENT_VERSION,
    });
    expect(document.clips).toHaveLength(1);
    expect(document.arrangementTracks).toHaveLength(2);
    expect(document.trackMixerStates).toHaveLength(2);
  });

  it("collects imported sample IDs from serializable metadata", () => {
    const { sampleMeta } = createImportedAudioClipDraft({
      clipId: "audio-clip-loop",
      durationSeconds: 1,
      fileName: "Loop.wav",
      mimeType: "audio/wav",
      sampleId: "imported-audio-loop",
    });
    const document = createPersistedProjectDocument({
      arrangementLengthBars: 16,
      arrangementLoopRange: createDefaultArrangementLoopRange(),
      arrangementTracks: [],
      clipInstances: [],
      clips: [],
      masterMixerState: createDefaultMasterMixerState(),
      name: "Project 1",
      sampleMetas: [
        {
          id: "fred-kick-1",
          name: "FRED KICK 1",
          source: {
            kind: "bundled",
            path: "/samples/drums/Fred_Kick_1.wav",
          },
        },
        sampleMeta,
      ],
      savedAt: 123,
      tempoBpm: 128,
      trackMixerStates: [],
    });

    expect(getImportedSampleIds(document)).toEqual(["imported-audio-loop"]);
  });

  it("rejects unknown or malformed project document versions", () => {
    expect(migratePersistedProjectDocument(null)).toBeNull();
    expect(migratePersistedProjectDocument({ version: 999 })).toBeNull();
    expect(
      migratePersistedProjectDocument({
        id: ACTIVE_PROJECT_ID,
        version: PROJECT_DOCUMENT_VERSION,
      }),
    ).toBeNull();
  });

  it("defaults old persisted project documents to 16 arrangement bars", () => {
    expect(
      migratePersistedProjectDocument({
        arrangementLoopRange: createDefaultArrangementLoopRange(),
        arrangementTracks: [],
        clipInstances: [],
        clips: [],
        id: ACTIVE_PROJECT_ID,
        masterMixerState: createDefaultMasterMixerState(),
        name: "Project 1",
        sampleMetas: [],
        savedAt: 123,
        tempoBpm: 128,
        trackMixerStates: [],
        version: PROJECT_DOCUMENT_VERSION,
      }),
    ).toMatchObject({
      arrangementLengthBars: 16,
    });
  });
});
