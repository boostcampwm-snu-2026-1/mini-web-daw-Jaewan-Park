import { describe, expect, it } from "vitest";

import {
  createImportedAudioClipDraft,
  createImportedAudioDisplayName,
  createImportedAudioIds,
  validateImportedWavFile,
} from "../../../src/model";

describe("audio clip model", () => {
  it("creates readable display names from imported file names", () => {
    expect(createImportedAudioDisplayName("Vocal_Stem_01.wav")).toBe(
      "Vocal Stem 01",
    );
    expect(createImportedAudioDisplayName("kick-loop.WAV")).toBe("kick loop");
  });

  it("validates WAV-like imported files", () => {
    expect(() =>
      validateImportedWavFile({
        name: "loop.wav",
        size: 128,
        type: "audio/wav",
      }),
    ).not.toThrow();
    expect(() =>
      validateImportedWavFile({
        name: "loop.mp3",
        size: 128,
        type: "audio/mpeg",
      }),
    ).toThrow("Only WAV files can be imported.");
    expect(() =>
      validateImportedWavFile({
        name: "empty.wav",
        size: 0,
        type: "audio/wav",
      }),
    ).toThrow("The selected WAV file is empty.");
  });

  it("creates stable unique IDs for imported audio clips and samples", () => {
    expect(
      createImportedAudioIds({
        existingClipIds: ["audio-clip-vocal-stem"],
        existingSampleIds: ["imported-audio-vocal-stem"],
        fileName: "Vocal_Stem.wav",
      }),
    ).toEqual({
      clipId: "audio-clip-vocal-stem-2",
      sampleId: "imported-audio-vocal-stem-2",
    });
  });

  it("creates serializable audio clip and sample metadata", () => {
    const draft = createImportedAudioClipDraft({
      clipId: "audio-clip-loop",
      durationSeconds: 2.5,
      fileName: "Loop.wav",
      mimeType: "audio/wav",
      sampleId: "imported-audio-loop",
    });

    expect(draft.clip).toEqual({
      durationSeconds: 2.5,
      id: "audio-clip-loop",
      kind: "audio",
      mimeType: "audio/wav",
      name: "Loop",
      sampleId: "imported-audio-loop",
      sourceFileName: "Loop.wav",
    });
    expect(draft.sampleMeta).toEqual({
      durationSeconds: 2.5,
      id: "imported-audio-loop",
      name: "Loop",
      source: {
        fileName: "Loop.wav",
        kind: "imported",
        mimeType: "audio/wav",
      },
    });
  });
});
