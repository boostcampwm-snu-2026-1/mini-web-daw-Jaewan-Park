# Feature: 20 Adjustable Arrangement Length

## Status
Planned

## Goal

Allow users to increase or decrease the arrangement length instead of keeping the arrangement fixed at 16 bars.

## Context

The current arrangement shell uses a fixed 16-bar timeline. Users need to extend the song as they build a project and reduce the length when the project is shorter.

The arrangement length should be serializable project state and should drive the ruler, grid, horizontal scroll area, loop boundaries, and export duration.

## Scope

Included:

- Add `arrangement.lengthBars` or an equivalent serializable field to project state.
- Default new projects to 16 bars.
- Add arrangement toolbar controls to increment and decrement the arrangement length.
- Derive ruler labels, grid width, loop bounds, and playback bounds from arrangement length.
- Keep a minimum arrangement length of 1 bar.
- Use a practical maximum length for the first implementation, such as 128 bars.
- Prevent or clearly confirm reducing arrangement length when clip instances would extend beyond the new end.
- Clamp or validate arrangement loop ranges so they remain inside the arrangement length.

Excluded:

- Infinite timeline behavior.
- Zoom controls.
- Track count management.
- Clip trimming or time-stretching.
- Export rendering.
- Advanced timeline virtualization unless performance requires it.

## Constraints

- Store arrangement length in musical units and derive ticks from PPQ/bar math.
- Keep the model serializable.
- Avoid coupling timeline rendering to audio scheduling internals.
- Do not delete clip instances outside a shortened range without explicit user confirmation.

## Done when

- The arrangement can be expanded beyond 16 bars.
- The arrangement can be reduced when safe.
- Ruler labels and grid lines match the selected arrangement length.
- Loop start/end controls cannot move outside the arrangement.
- Playback uses the current arrangement length and loop range.
- The selected arrangement length survives project persistence once persistence exists.

## Verification

Run:

- `npm run typecheck --if-present`
- `npm run lint --if-present`
- `npm run test --if-present`
- `npm run build --if-present`

Manual check:

- Increase the arrangement length and confirm bars appear past 16.
- Decrease the arrangement length and confirm the ruler/grid update.
- Try reducing length below existing clip instances and confirm the app blocks or confirms the destructive action.
- Confirm loop handles stay within the arrangement bounds.
- Confirm playback still loops over the selected range.

## PR notes

- Summarize the model field used for arrangement length.
- Explain the chosen min/max bar limits.
- Note how shortening is handled when clips exist past the new end.
