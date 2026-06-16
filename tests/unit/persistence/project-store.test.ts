import { describe, expect, it } from "vitest";

import {
  ACTIVE_PROJECT_ID,
  DEFAULT_PROJECT_ID,
  PROJECT_DOCUMENT_VERSION,
  createProjectCollectionState,
  createProjectId,
  createProjectSampleBlobId,
  createPersistedProjectDocument,
  getImportedSampleIds,
  migrateProjectCollectionState,
  migratePersistedProjectDocument,
  removeProjectSummary,
  upsertProjectSummary,
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
  it("creates a versioned serializable project document", () => {
    const tracks = createDefaultArrangementTracks(2);
    const document = createPersistedProjectDocument({
      arrangementLengthBars: 16,
      arrangementLoopRange: createDefaultArrangementLoopRange(),
      arrangementTracks: tracks,
      clipInstances: [],
      clips: [createEmptyHybridClip({ id: "clip-1" })],
      createdAt: 100,
      id: "project-7",
      masterMixerState: createDefaultMasterMixerState(),
      name: "Project 1",
      sampleMetas: [],
      savedAt: 123,
      tempoBpm: 128,
      trackMixerStates: createDefaultTrackMixerStates(tracks),
    });

    expect(document).toMatchObject({
      arrangementLengthBars: 16,
      createdAt: 100,
      id: "project-7",
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
      id: DEFAULT_PROJECT_ID,
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
      createdAt: 123,
    });
  });

  it("creates stable project IDs after existing project IDs", () => {
    expect(createProjectId([])).toBe("project-1");
    expect(createProjectId(["project-1", "project-3", "custom"])).toBe(
      "project-4",
    );
  });

  it("normalizes project collection state and summaries", () => {
    const collection = createProjectCollectionState({
      activeProjectId: "missing-project",
      projects: [
        {
          createdAt: 20,
          id: "project-2",
          name: "Project 2",
          updatedAt: 30,
        },
        {
          createdAt: 10,
          id: "project-1",
          name: "Project 1",
          updatedAt: 20,
        },
      ],
    });

    expect(collection).toEqual({
      activeProjectId: "project-1",
      projects: [
        {
          createdAt: 10,
          id: "project-1",
          name: "Project 1",
          updatedAt: 20,
        },
        {
          createdAt: 20,
          id: "project-2",
          name: "Project 2",
          updatedAt: 30,
        },
      ],
    });
  });

  it("upserts and removes project summaries", () => {
    const tracks = createDefaultArrangementTracks(1);
    const collection = createProjectCollectionState({
      activeProjectId: "",
      projects: [],
    });
    const project = createPersistedProjectDocument({
      arrangementLengthBars: 16,
      arrangementLoopRange: createDefaultArrangementLoopRange(),
      arrangementTracks: tracks,
      clipInstances: [],
      clips: [createEmptyHybridClip({ id: "clip-1" })],
      createdAt: 100,
      id: "project-1",
      masterMixerState: createDefaultMasterMixerState(),
      name: "Project 1",
      sampleMetas: [],
      savedAt: 200,
      tempoBpm: 128,
      trackMixerStates: createDefaultTrackMixerStates(tracks),
    });
    const nextCollection = upsertProjectSummary({ collection, project });

    expect(nextCollection).toMatchObject({
      activeProjectId: "project-1",
      projects: [
        {
          createdAt: 100,
          id: "project-1",
          name: "Project 1",
          updatedAt: 200,
        },
      ],
    });
    expect(
      removeProjectSummary({
        collection: nextCollection,
        projectId: "project-1",
      }),
    ).toEqual({
      activeProjectId: "",
      projects: [],
    });
  });

  it("migrates project collection state", () => {
    expect(
      migrateProjectCollectionState({
        activeProjectId: "project-2",
        projects: [
          {
            createdAt: 100,
            id: "project-1",
            name: "Project 1",
            updatedAt: 120,
          },
          {
            createdAt: 200,
            id: "project-2",
            name: "Project 2",
            updatedAt: 220,
          },
        ],
      }),
    ).toMatchObject({
      activeProjectId: "project-2",
    });
    expect(
      migrateProjectCollectionState({
        activeProjectId: "project-1",
        projects: [{ id: "project-1" }],
      }),
    ).toBeNull();
  });

  it("creates scoped imported sample blob IDs", () => {
    expect(createProjectSampleBlobId("project-1", "imported-audio-loop")).toBe(
      "project-1::imported-audio-loop",
    );
  });
});
