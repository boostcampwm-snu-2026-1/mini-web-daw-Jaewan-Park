# Feature: 12 Sidebar Clip and Instrument Management

## Status
In Review

## Goal

Make the left project sidebar a real clip and instrument management surface.

Users should be able to create, select, rename, and delete clips. Within each clip, users should be able to add and remove available pitched instruments, then select an instrument to edit its piano roll notes.

## Context

The current sidebar already presents `CLIP 1`, a mandatory `Drums` item, and pitched instrument entries such as `Default Synth` and `Iowa Piano`. Selection is useful because the piano roll shows notes for the selected pitched instrument.

The next step is to make that sidebar state editable instead of static. This requires a small serializable clip collection model, per-clip pitched instrument membership, and safe selection fallback when clips or instruments are removed.

This feature is separate from arrangement editing. Creating clips here creates reusable 1-bar hybrid clips for the M1 clip editor; it does not place clip instances on an arrangement timeline.

## Scope

Included:
- Create new 1-bar hybrid clips from the sidebar.
- Select clips from the sidebar and update the visible clip editor.
- Rename or otherwise edit clip names from the sidebar.
- Delete clips from the sidebar.
- Keep at least one clip available; do not allow the project to end in a zero-clip state.
- Show `+` and `-` icon buttons for add/delete actions where practical.
- Keep `Drums` as a mandatory child item for every hybrid clip.
- Show a scrollable or compact list of available pitched instruments when adding an instrument to a clip.
- Initial available pitched instruments are `Default Synth` and `Iowa Piano`.
- Add pitched instruments to the selected clip.
- Prevent duplicate pitched instrument entries in the same clip for the first version.
- Remove pitched instruments from the selected clip.
- Allow a clip to have zero pitched instruments; when this happens, the piano roll should show `-` as the instrument name and avoid creating pitched notes until an instrument is added.
- If removing a pitched instrument would delete that instrument's notes, require an explicit confirmation or a clearly documented safe fallback.
- Store clip list and per-clip pitched instrument membership in serializable state.
- Preserve `NoteEvent.instrumentId` ownership so multiple pitched instruments can coexist inside one hybrid clip.
- Update relevant data model, UI, and testing docs.

Excluded:
- Arrangement clip placement or `ClipInstance` editing.
- Clip drag-and-drop reordering.
- Instrument drag-and-drop reordering.
- Drum lane add/delete.
- User-created custom instruments.
- User sample import.
- Full project export/import.
- IndexedDB autosave.
- Clip duplication.
- Keyboard shortcuts.
- Audio effects, mixer, or routing changes.

## Constraints

- Keep React UI separate from audio scheduling logic.
- Project and clip state must remain serializable.
- Do not store `AudioBuffer`, `AudioNode`, or decoded sample data in project state.
- Store musical event time in ticks.
- Use CSS Modules and semantic design tokens for sidebar UI changes.
- Use semantic buttons with accessible labels for icon-only `+` and `-` controls.
- Do not add a runtime dependency unless the implementation clearly justifies it.
- Do not remove the mandatory `Drums` child item in this first version.
- Do not close issue #30 until all acceptance criteria are implemented and verified.

## Data Model Notes

The implementation should introduce or formalize app-level project state containing an ordered clip list. A selected clip ID and selected sidebar item may remain runtime UI state.

Each hybrid clip should store a serializable list of pitched instruments available inside that clip, for example:

```ts
export interface Clip {
  id: string;
  name: string;
  lengthTicks: Tick;
  drumLanes: DrumLaneDefinition[];
  drumEvents: DrumEvent[];
  pitchedInstrumentIds: string[];
  noteEvents: NoteEvent[];
}
```

`pitchedInstrumentIds` controls which pitched instrument entries are visible under the clip. `NoteEvent.instrumentId` still controls which instrument owns each note.

Deleting a pitched instrument must deliberately handle note events with that `instrumentId`. The preferred first behavior is:

- Ask for confirmation if notes exist for the instrument.
- On confirmation, remove the instrument entry and delete only note events owned by that instrument.
- If confirmation UI is not implemented, keep the delete action disabled while owned notes exist and explain why.

## UI Notes

The sidebar should keep the existing compact DAW style:

- Clip rows show selection state.
- Clip rows expose an add-instrument `+` control and a delete-clip `-` control.
- The Clips section or project area exposes an add-clip `+` control.
- Pitched instrument rows expose a remove-instrument `-` control.
- Icon-only controls must have `aria-label`.
- `aria-expanded` should reflect expanded or collapsed clip groups when practical.
- The instrument picker should not be clipped by sidebar or workspace overflow.

The first implementation may use inline rename controls, a small popover, or a simple focused editing state. A large modal is not required.

## Done when

- Users can create a new 1-bar hybrid clip from the sidebar.
- Users can select between clips and the main clip editor updates to the selected clip.
- Users can rename or edit a clip name.
- Users can delete a clip, with safe fallback selection and no zero-clip project state.
- Each clip shows its own mandatory `Drums` child item.
- Users can open an available-instrument list from the sidebar.
- Users can add `Default Synth` or `Iowa Piano` to a clip when it is not already present.
- Users cannot add duplicate pitched instrument entries to the same clip.
- Users can remove a pitched instrument safely.
- Removing a pitched instrument handles that instrument's note events according to the documented behavior.
- Pitched instrument selection updates the piano roll visible/editable instrument.
- Serializable state represents the clip list and per-clip pitched instrument membership.
- Existing drum sequencer, piano roll editing, transport, and scheduler behavior continue to work for the selected clip.
- Relevant docs and tests are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Add a new clip and confirm it appears in the sidebar.
- Select each clip and confirm the editor shows that clip's drum and note state.
- Rename a clip and confirm the label updates.
- Delete a non-selected clip and confirm the current selection remains valid.
- Delete the selected clip and confirm a nearby remaining clip becomes selected.
- Confirm the last remaining clip cannot be deleted or is immediately replaced with a valid empty clip.
- Add `Default Synth` and `Iowa Piano` to a clip from the instrument picker.
- Confirm unavailable or already-added instruments cannot be duplicated.
- Remove a pitched instrument with no notes.
- Remove a pitched instrument with notes and confirm the implemented confirmation or safe fallback behavior.
- Confirm `Drums` cannot be removed in this version.
- Confirm icon buttons have accessible names and visible focus states.

## PR notes

- Reference issue #30.
- Explain how clip list state is represented.
- Explain how per-clip pitched instrument membership is represented.
- Explain the note deletion behavior when removing a pitched instrument.
- Mention that arrangement placement, persistence, sample import, and custom instruments are intentionally deferred.
