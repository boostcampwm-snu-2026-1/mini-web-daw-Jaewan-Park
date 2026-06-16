# Feature: 16 Arrangement Clip Placement and Playback

## Status
Done

## Goal

Allow users to place reusable clips on the `SONG` arrangement timeline and play the arranged song from the transport.

This turns the arrangement view from a static shell into the first usable song-building surface.

## Context

The app already has:

- A `PAT` mode for focused clip editing.
- A `SONG` mode arrangement UI shell.
- A left sidebar that manages clips and clip child items.
- Transport play, pause, resume, stop, playhead, and tempo behavior for clip playback.
- Planned WAV import as audio clips in `docs/features/15-wav-file-import-as-audio-clip.md`.

Users now need to place clips horizontally in time and vertically across tracks. Playback in `SONG` mode should schedule the placed clip instances instead of looping only the selected `PAT` clip.

## Scope

Included:
- Make sidebar clips draggable into the arrangement timeline where practical.
- Create serializable `ClipInstance` entries when clips are placed.
- Store arrangement placement with `clipId`, `trackId`, `startTick`, and `lengthTicks`.
- Render arrangement clip blocks from project or app model state instead of static demo blocks.
- Move existing clip instances horizontally and vertically by drag where practical.
- Snap dropped and moved clip instances to the arrangement grid.
- Select and delete placed clip instances.
- Keep the existing arrangement track list and timeline layout aligned.
- Add a visual arrangement playhead in `SONG` mode.
- Let users set arrangement loop start and loop end on bar boundaries.
- Make transport play, pause, resume, and stop operate on arrangement playback when `SONG` mode is active.
- Schedule placed hybrid clips by expanding their drum and note events relative to each `ClipInstance.startTick`.
- Schedule placed audio clips when imported audio runtime data is available.
- Keep imported audio playback at original speed; no time stretching in this feature.
- Add focused tests for clip instance creation, moving, deletion, snapping, and scheduler event expansion where practical.
- Update relevant product, architecture, data model, audio, UI, and testing docs.

Excluded:
- Time stretching or tempo matching imported audio.
- Clip instance resize handles.
- Clip splitting.
- Arrangement recording.
- Track creation, deletion, or reordering.
- Multi-select, copy/paste, duplicate shortcuts, or marquee selection.
- Arrangement loop region editing.
- Persistent project export/import beyond serializable in-memory model changes.
- IndexedDB persistence for imported audio bytes.
- Full mixer audio routing, real level metering, or effects.

## Constraints

- React UI must not own exact audio timing.
- Store arrangement positions and lengths in ticks.
- Use PPQ 480, where one 4/4 bar is 1920 ticks.
- Keep project data serializable.
- Do not store `AudioBuffer`, `AudioNode`, `File`, `Blob`, object URLs, scheduler timers, or drag runtime objects in project JSON.
- Playback must schedule audio against `AudioContext.currentTime`.
- Audio clip source duration may be seconds because it describes media length, but arrangement placement still uses ticks.
- Imported audio clips must fail clearly if their runtime file data is missing.
- Use CSS Modules and semantic design tokens for UI changes.
- Preserve existing `PAT` mode clip editing behavior.

## Data Model Notes

The arrangement should use serializable clip instances:

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

For hybrid clips, the first implementation should use the clip's `lengthTicks` as the default instance length. Hybrid clip events play once relative to the instance start. Repeating a pattern should be represented by multiple placed instances until a later feature adds looping or repeat handles.

For imported audio clips, `lengthTicks` controls the visible and scheduled clip-instance duration. Without time stretching, playback uses the decoded audio at original speed:

- If the instance is shorter than the source, playback is cropped.
- If the instance is longer than the source, the remaining duration is silence.
- If runtime imported file data is unavailable after refresh, the clip instance should remain visible but audio playback should report a clear missing-source limitation.

The first implementation may seed a small set of arrangement tracks in app state. Track creation, deletion, and reordering are separate tasks.

## UI Notes

Use the existing `SONG` arrangement layout:

- Sidebar clip rows are drag sources.
- Arrangement track lanes are drop targets.
- Placed clips render as timeline blocks.
- Dragging a placed clip moves it to another snapped start time or track.
- Selecting a placed clip shows a clear selected state.
- Right-clicking a placed clip instance deletes only that arrangement placement, not the source clip from the sidebar.

Snap should start simple. Prefer beat-level snapping, using 480 ticks, unless the existing arrangement snap control already supports a narrower value. Later features may add user-selectable snap resolution.

If browser drag-and-drop is awkward for track timeline geometry, pointer-based dragging is acceptable. The feature should still behave like drag placement from the user's perspective.

## Audio Notes

`SONG` playback should schedule arrangement events, not selected-clip loop events.

Selecting a sidebar clip or instrument while `SONG` mode is playing should only change UI selection. It must not replace active arrangement playback with selected `PAT` clip events or stop playback just because an imported audio clip was selected.

The audio engine or feature orchestration should expand clip instances into runtime scheduler events:

- Hybrid clip drum events: `instance.startTick + drumEvent.startTick`.
- Hybrid clip note events: `instance.startTick + noteEvent.startTick`.
- Audio clips: source starts at `instance.startTick`, optionally from `sourceOffsetSeconds`.

The arrangement transport may initially play linearly from tick 0 through the end of the last clip instance and then stop. Arrangement loop ranges can be added later.

The first implementation may reuse the existing lookahead loop scheduler over the visible arrangement range while the arrangement-specific one-shot/linear transport matures. If so, document the limitation in the PR and keep the arrangement event expansion independent from React.

When an arrangement loop range is set, `SONG` playback should use that range for `loopStartTick` and `loopEndTick`.

Events already scheduled inside the lookahead window may still play briefly after edits, pause, or stop. Keep the scheduling window short enough for interactive editing.

## Done when

- Users can drag a sidebar clip into a `SONG` arrangement track.
- A placed clip block appears at the snapped time and correct track.
- Placed clip blocks are backed by serializable `ClipInstance` data.
- Static demo arrangement clips are removed or replaced by seeded serializable model state.
- Users can move a placed clip instance to another snapped time or track.
- Users can select and delete a placed clip instance without deleting the source clip.
- `SONG` transport playback schedules placed clip instances.
- Pause, resume, and stop work in `SONG` mode.
- A visual arrangement playhead follows playback and resets or hides appropriately when stopped.
- Loop start and loop end can be set on bar boundaries and `SONG` playback loops that range.
- Hybrid clip drum and note events play at their arrangement positions.
- Audio clip instances play when runtime imported audio data is available.
- Missing imported audio runtime data is reported clearly instead of silently failing.
- `PAT` mode clip editing and clip playback still work.
- Relevant tests and docs are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Switch to `SONG` mode.
- Drag a sidebar clip into an arrangement track.
- Confirm the placed clip aligns to the snapped grid.
- Drag the placed clip to another time and track.
- Select and delete the placed clip.
- Place multiple clips across tracks and press play.
- Confirm the arrangement playhead roughly matches audible playback.
- Confirm pause, resume, and stop behavior in `SONG` mode.
- Confirm `PAT` mode still edits and plays the selected clip.
- If WAV import is implemented, place an imported audio clip and confirm it plays when runtime data is available.
- Refresh the page and confirm missing imported audio data is handled clearly if persistence is not implemented.

## PR notes

- Reference issue #41.
- Explain the `ClipInstance` model changes or model usage.
- Explain how sidebar drag placement and arrangement move/delete work.
- Explain how `SONG` playback differs from `PAT` clip loop playback.
- State clearly that time stretching, resizing, arrangement loop regions, and persistent imported audio bytes are deferred.
