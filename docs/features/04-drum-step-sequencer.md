# Feature: 04 Drum Step Sequencer

## Status
In Progress

## Goal

Build a 16-step drum sequencer for the selected 1-bar hybrid clip.

## Context

The first clip editor needs drum programming that stores events in the serializable clip model and can integrate with the existing audio playback/scheduler when present.

## Scope

Included:
- Render a 16-step grid.
- Add initial lanes for kick, snare, closed hi-hat, and open hi-hat.
- Toggle steps on and off.
- Store events in the clip model using tick positions.
- Use CSS Modules for styling.
- Use semantic buttons for step toggles.
- Integrate with the existing audio playback/scheduler if already present.

Excluded:
- Piano roll.
- Arrangement view.
- Sample import.
- Advanced velocity editing unless simple velocity is already easy.
- Swing or groove editing.

## Constraints
- Store step positions in ticks.
- Use 120 ticks per 16-step grid step for a 1-bar 4/4 clip at PPQ 480.
- Keep UI rendering separate from scheduler internals.
- Keep project data serializable.

## Done when
- Users can toggle drum steps for the four initial lanes.
- Drum events are added to and removed from the selected clip model.
- Step buttons have accessible names and visible focus states.
- Playback integration works if the scheduler exists.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Toggle steps in each lane and confirm model state updates.
- If playback exists, confirm enabled steps trigger the expected sounds in a loop.

## PR notes
- Describe how lanes map to sample IDs.
- Note whether playback integration was included or deferred.
