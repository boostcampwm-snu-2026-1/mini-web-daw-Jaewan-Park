# Feature: 15 WAV File Import as Audio Clip

## Status
Planned

## Goal

Allow users to import a local `.wav` file from the clip add flow and create an audio clip that can be selected from the project sidebar.

The first version should make imported audio usable as clip content without adding arrangement placement, waveform editing, persistent imported-file storage, or time stretching.

## Context

The sidebar currently has a clip add button that directly creates a new hybrid clip. Users also need a way to bring their own audio material into the project.

The new clip add flow should offer two choices:

- `Build a clip`: the current behavior, creating a new editable hybrid clip.
- `Import a file`: opens a file picker for a local `.wav` file and creates an audio clip.

Imported audio files are browser-local user files. The app may decode and cache runtime audio buffers for playback, but project JSON must store only serializable metadata and stable IDs. File bytes, `Blob`, `File`, `AudioBuffer`, object URLs, and audio nodes must remain outside project JSON.

## Scope

Included:
- Change the sidebar clip add button so it opens a compact choice menu.
- Add `Build a clip` as the existing new hybrid clip path.
- Add `Import a file` as a new path that opens a browser file picker.
- Accept `.wav` files only in the first version.
- Validate the selected file enough to reject non-WAV or undecodable files.
- Decode or inspect the selected WAV to collect duration metadata.
- Create a serializable audio clip entry that references imported audio metadata by stable ID.
- Display the imported audio clip in the sidebar clip list.
- Selecting the imported audio clip should show a simple audio clip detail or placeholder editor instead of the drum sequencer and piano roll.
- Show useful imported file metadata such as file name, display name, duration, and file type when practical.
- Keep imported file bytes and decoded `AudioBuffer` data in runtime-only storage.
- Document that imported files are not persisted across refresh until IndexedDB or another persistence feature is implemented.
- Preserve the existing hybrid clip creation behavior under `Build a clip`.
- Use CSS Modules and semantic design tokens for UI changes.
- Add focused unit tests for model transformations and file-name/display-name helpers where practical.
- Add focused audio/import tests for validation or metadata helpers where practical.
- Update relevant data model, audio engine, UI, architecture, and testing docs.

Excluded:
- Importing MP3, AIFF, FLAC, OGG, or other formats.
- Drag-and-drop file import.
- Sample slicing or waveform editing.
- Automatic tempo detection.
- Time stretching or pitch shifting imported audio.
- Adjusting clip duration during import.
- Arrangement placement or arrangement playback of imported audio.
- Resizing audio clip instances in the arrangement view.
- Persisting imported file bytes to IndexedDB.
- Project export/import that includes imported file bytes.
- Cloud upload or server-side storage.
- Recording audio in real time.

## Constraints

- React UI must not own exact audio timing.
- Musical arrangement positions should still use ticks.
- Imported audio source duration may be measured in seconds because it describes source media, not musical grid position.
- Project state must remain serializable.
- Do not store `File`, `Blob`, object URLs, `AudioBuffer`, `AudioNode`, or decoded PCM data in project JSON.
- Runtime audio caches and object URLs must have clear cleanup ownership.
- Do not add runtime dependencies unless a follow-up architecture decision justifies them.
- Do not implement arrangement duration resizing in this feature.

## Data Model Notes

The model should distinguish hybrid clips from imported audio clips.

One possible shape:

```ts
export type Clip = HybridClip | AudioClip;

export interface AudioClip {
  id: string;
  kind: "audio";
  name: string;
  sampleId: string;
  sourceFileName: string;
  durationSeconds: number;
}

export interface SampleMeta {
  id: string;
  name: string;
  durationSeconds?: number;
  source: {
    kind: "bundled" | "imported";
    fileName?: string;
    mimeType?: string;
  };
}
```

Implementation names may differ, but the important rules are:

- `AudioClip.sampleId` points to serializable sample metadata.
- Runtime file objects and decoded buffers are not stored in clip data.
- Imported audio clips may be lost on refresh until browser persistence is added.

## Future Arrangement Duration Notes

It is feasible to resize imported audio clips later in the arrangement view if arrangement placement is represented separately from the source clip.

Preferred future shape:

```ts
export interface ClipInstance {
  id: string;
  clipId: string;
  trackId: string;
  startTick: Tick;
  lengthTicks: Tick;
  sourceOffsetSeconds?: number;
}
```

For an imported audio clip, `lengthTicks` can control the visible and playable arrangement duration without rewriting the original audio file.

Important limitation: without time stretching, resizing an audio clip instance should mean non-destructive trim/crop or extending silence after the source ends. Making the audio file musically stretch to a new duration is a separate time-stretching feature and may require a dedicated DSP approach or dependency.

## Done when

- The sidebar clip add button opens a menu with `Build a clip` and `Import a file`.
- `Build a clip` preserves the existing hybrid clip creation behavior.
- `Import a file` opens a file picker that accepts `.wav` files.
- Selecting a valid WAV creates an audio clip in the sidebar.
- Selecting the audio clip shows an audio clip detail or placeholder editor instead of drum/piano editors.
- Invalid or undecodable files show a clear error and do not create broken clip state.
- Imported audio metadata is serializable.
- Runtime-only file, object URL, decoded buffer, and audio node data are not stored in project JSON.
- Relevant docs and tests are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Click the sidebar clip add button and confirm the menu shows `Build a clip` and `Import a file`.
- Choose `Build a clip` and confirm a normal hybrid clip is created.
- Choose `Import a file` and confirm the browser file picker accepts WAV files.
- Import a valid WAV and confirm a new audio clip appears in the sidebar.
- Select the imported audio clip and confirm the app shows audio clip information rather than the drum sequencer and piano roll.
- Try an invalid file and confirm the app shows an error without corrupting clip state.
- Refresh the page and confirm any non-persisted imported file limitation is understandable.

## PR notes

- Reference the GitHub issue for this feature.
- Explain how imported audio clip metadata is represented.
- Explain what runtime-only data is kept outside project JSON.
- State clearly that arrangement placement, duration resizing, time stretching, and persistent imported file storage are deferred.
