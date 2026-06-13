# Feature: 13 Drum Step Subdivisions

## Status
In Review

## Goal

Allow users to subdivide the existing 16 drum sequencer steps into smaller hit targets while preserving the familiar `1` through `16` primary step labels.

The first version should support subdivision values `1`, `2`, and `3`:

- `1`: current 16-step behavior.
- `2`: each primary step splits into two substeps.
- `3`: each primary step splits into three substeps.

## Context

The M1 drum sequencer currently treats a 4/4 one-bar clip as 16 primary steps. At PPQ 480, one primary step is 120 ticks.

That works for basic 16th-note patterns, but real drum programming often needs faster hits, off-grid variations, or triplet-like placements. Users should be able to keep the simple 1-16 structure while making the clickable boxes below each numbered step more granular.

This feature should keep the sequencer understandable. It is not a full groove, ratchet, probability, or velocity editor.

## Scope

Included:
- Add a drum step subdivision setting with options `1`, `2`, and `3`.
- Store the subdivision setting in serializable clip state.
- Apply the subdivision setting to all drum lanes in the selected clip for the first version.
- Keep the existing `1` through `16` primary step labels visible.
- Render substep buttons below each primary step label.
- Use one substep button per primary step when subdivision is `1`.
- Use two substep buttons per primary step when subdivision is `2`.
- Use three substep buttons per primary step when subdivision is `3`.
- Toggle drum events at tick positions derived from primary step index and substep index.
- Preserve existing 16-step patterns as subdivision `1` behavior.
- Keep existing drum lane sample selection and lane reordering behavior.
- Ensure playback schedules subdivided drum hits at the correct ticks.
- Use CSS Modules and semantic design tokens for UI changes.
- Add focused tests for subdivision tick math and drum event toggling where practical.
- Update relevant data model, audio engine, UI, and testing docs.

Excluded:
- Per-lane subdivision settings.
- Swing or groove timing.
- Humanization.
- Velocity editing.
- Probability or conditional triggers.
- Ratchets, flams, rolls, or repeat effects.
- Piano roll grid changes.
- Arrangement editing or arrangement playback changes.
- Custom time signatures.
- Variable clip length.

## Constraints

- Store musical time in ticks, not seconds.
- Keep PPQ 480 and 4/4 one-bar length 1920 ticks.
- Keep React UI separate from exact audio scheduling.
- Schedule playback against `AudioContext.currentTime`.
- Project data must remain serializable.
- Do not store runtime audio objects in project JSON.
- Do not add runtime dependencies unless clearly justified.
- Preserve the CSS Modules and primitive/semantic token policy.
- Do not close issue #32 until all acceptance criteria are implemented and verified.

## Tick Math

Primary 16-step math stays unchanged:

```text
1 bar = 1920 ticks
1 primary step = 1920 / 16 = 120 ticks
```

The subdivision tick size is:

```text
substepTicks = 120 / subdivision
```

Supported values:

```text
subdivision 1 -> substepTicks 120
subdivision 2 -> substepTicks 60
subdivision 3 -> substepTicks 40
```

The event start tick is:

```text
startTick = primaryStepIndex * 120 + substepIndex * substepTicks
```

Both indices are zero-based in code. Display labels remain one-based for primary steps.

## Data Model Notes

The implementation should store the selected drum subdivision in the clip model, for example:

```ts
export interface Clip {
  id: string;
  name: string;
  lengthTicks: Tick;
  drumStepSubdivision: 1 | 2 | 3;
  drumLanes: DrumLaneDefinition[];
  drumEvents: DrumEvent[];
  noteEvents: NoteEvent[];
}
```

`DrumEvent.startTick` remains the source of truth for event timing. Do not store UI-only primary step or substep indexes as the event position.

Changing the subdivision should not rewrite existing `DrumEvent.startTick` values. Events that land on visible substep positions for the selected subdivision should render as active. Events that do not align with the current subdivision should remain in the model and can be hidden, shown as off-grid markers, or left untouched by the first implementation. The preferred first behavior is to preserve them and document how they are displayed.

## UI Notes

The sequencer should keep a compact, readable layout:

- The top row keeps primary step labels `1` through `16`.
- Each primary step column contains a nested substep group below the label.
- Substep buttons should be visually smaller than the current primary step buttons.
- Beat grouping should still be visible every four primary steps.
- Subdivision `2` and `3` can widen the sequencer horizontally if needed, but the layout should avoid document-level scrolling.
- If width becomes tight, the step sequencer panel may scroll internally.
- The subdivision selector should be near the drum sequencer header, using labels such as `1x`, `2x`, and `3x`.
- The active subdivision option should use `aria-pressed` or equivalent selected state.
- Each substep button should have an accessible label, for example `Toggle Kick step 5 substep 2`.

Avoid making each lane header excessively narrow to compensate for more substep buttons. Preserving readable drum lane names is more important than fitting every subdivision into a fixed width.

## Done when

- Users can switch the drum sequencer subdivision between `1`, `2`, and `3`.
- Subdivision `1` matches the current 16-step behavior.
- Subdivision `2` renders two substep buttons under each primary step label.
- Subdivision `3` renders three substep buttons under each primary step label.
- Toggling a substep adds or removes a `DrumEvent` at the correct tick.
- Existing 16-step patterns still render and play correctly.
- Subdivided events play at the expected timing during loop playback.
- Loop boundaries do not double-trigger subdivided events.
- Changing subdivision does not unexpectedly delete existing drum events.
- Drum lane sample selection and lane reordering still work.
- Relevant docs and tests are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Select subdivision `1` and confirm the sequencer behaves like the current 16-step grid.
- Select subdivision `2` and toggle both substeps inside several primary steps.
- Select subdivision `3` and toggle all three substeps inside several primary steps.
- Confirm event timing by listening to loop playback at a moderate tempo.
- Confirm hits near the end of the bar loop correctly and do not double-trigger.
- Switch subdivision values and confirm existing events are preserved.
- Confirm lane sample selection still works.
- Confirm lane reordering still works.
- Confirm keyboard focus and accessible names work for subdivision controls and substep buttons.

## PR notes

- Reference issue #32.
- Explain how `drumStepSubdivision` is represented in clip state.
- Explain the tick conversion from primary step and substep to `DrumEvent.startTick`.
- Explain how existing events are preserved when subdivision changes.
- Mention any UI limitation around horizontal space or internal scrolling.
