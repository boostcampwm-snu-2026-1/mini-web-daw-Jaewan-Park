# Feature: 19 Variable Hybrid Clip Length

## Status
In Review

## Goal

Allow hybrid clips to be 1, 2, or 4 bars long instead of always being fixed to 1 bar.

## Context

The current first milestone focuses on a 1-bar hybrid clip editor. As patterns become more musical, users need longer clips for drum variations and melodic phrases.

Musical time is stored in ticks with PPQ 480. In 4/4:

- 1 beat = 480 ticks
- 1 bar = 1920 ticks
- 2 bars = 3840 ticks
- 4 bars = 7680 ticks

## Scope

Included:

- Add a clip length control for 1, 2, and 4 bars.
- Store the selected length as `lengthTicks` in the clip model.
- Derive editor grids from clip length rather than hard-coded 1-bar constants.
- Extend the drum step sequencer across the selected clip length using the existing 16th-note step behavior.
- Extend the piano roll grid across the selected clip length.
- Keep drum and note event start times and durations in ticks.
- Make clip loop playback use the selected clip length.
- Make arrangement clip instances default to the source clip length.
- Prevent or clearly confirm shortening a clip when events would fall outside the new length.

Excluded:

- Arbitrary clip lengths.
- Time signatures other than 4/4.
- Per-clip tempo.
- Audio time-stretching.
- Arrangement clip trimming.
- Clip duplication workflows beyond what already exists.

## Constraints

- Do not store seconds as the source of truth.
- Do not duplicate grid constants across components when a shared utility can derive them.
- Keep editor rendering separate from audio scheduling.
- Preserve existing 1-bar behavior.
- If shortening requires destructive deletion of events, require explicit user confirmation or block the change with a clear message.

## Done when

- A user can choose 1, 2, or 4 bars for a hybrid clip.
- Drum and piano roll editors reflect the selected clip length.
- Events cannot silently exist outside the clip length.
- Clip playback loops over the selected clip length.
- Arrangement placement uses the clip's actual length.
- Existing 1-bar clips still load and behave correctly.

## Verification

Run:

- `npm run typecheck --if-present`
- `npm run lint --if-present`
- `npm run test --if-present`
- `npm run build --if-present`

Manual check:

- Create or edit a 1-bar clip.
- Change it to 2 bars and add events in bar 2.
- Change it to 4 bars and add events in bars 3 or 4.
- Confirm playback loops over the full clip length.
- Confirm shortening does not silently drop events.

## PR notes

- Summarize how clip length is represented in ticks.
- Note how grid rendering and scheduler loop length were updated.
- Call out any remaining UX limitations for long clips.
