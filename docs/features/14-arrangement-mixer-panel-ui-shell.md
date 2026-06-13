# Feature: 14 Arrangement Mixer Panel UI Shell

## Status
In Review

## Goal

Add a bottom dock mixer panel to the `SONG` arrangement view.

The mixer panel should establish the track-level mixing UI shape early: channel strips, volume faders, level meters, mute/solo controls, basic effect slots, and a master channel area.

## Context

Mixer controls are song-level and track-level controls. They belong with arrangement work rather than the focused `PAT` clip editor.

The current arrangement view is a UI shell for timeline layout. The next useful shell-level addition is a bottom dock mixer panel that can later connect to real Web Audio routing. Starting with a panel now is preferable to adding tiny temporary controls to track headers and migrating them later.

This feature should not implement the actual audio mixer yet. It should make the UI and component structure ready for future routing, metering, and effects work.

## Scope

Included:
- Render a bottom dock mixer panel inside `SONG` mode.
- Keep the existing top transport bar and left project sidebar.
- Keep the arrangement timeline visible above the mixer panel.
- Add track channel strips corresponding to the visible arrangement tracks.
- Include a master channel strip if practical.
- Each track channel strip should include:
  - Track name.
  - Volume fader.
  - Level meter.
  - Mute toggle.
  - Solo toggle.
  - Basic effect slot placeholder.
- Support local visual state for volume, mute, solo, and selected effect slot where useful.
- Use placeholder or mock level meter values only.
- Make channel strips horizontally scrollable if they do not fit.
- Use CSS Modules and semantic design tokens.
- Preserve the primitive-to-semantic token policy.
- Update relevant UI, architecture, audio, data model, and testing docs.

Excluded:
- Real Web Audio mixer routing.
- Real gain node volume changes.
- Real mute or solo audio behavior.
- Real level metering from `AnalyserNode` or audio signal data.
- Real effect processing.
- Effect chain editing.
- Effect preset persistence.
- Arrangement data model editing.
- Track creation, deletion, or reordering.
- Mixer automation.
- Recording arm/input monitoring.
- Master export or offline rendering.

## Constraints

- React UI must not own exact audio timing.
- Do not store `AudioNode`, `AnalyserNode`, `GainNode`, or audio signal buffers in project JSON.
- The first mixer panel may use UI-local state; real mixer state persistence should wait for a model/routing feature.
- Do not introduce runtime dependencies unless clearly justified.
- Keep styling in CSS Modules.
- Component CSS should reference semantic tokens, not primitive tokens.
- Do not close issue #34 until all acceptance criteria are implemented and verified.

## UI Notes

Use a bottom dock layout in the arrangement view:

```text
SONG workspace
  Arrangement timeline
  Bottom mixer panel
    Track channel strips
    Master channel strip
```

The panel should feel dense and DAW-like:

- Compact channel strips with clear borders.
- Vertical volume faders.
- Thin level meters.
- `M` and `S` buttons for mute and solo.
- A small effect slot row such as `FX: None` or `FX: Basic`.
- Track color or accent indicators if already available.
- Horizontal scrolling inside the mixer panel when track count exceeds available width.

The first implementation may use mock level values or static meter bars. If meter animation is added, it must be clearly visual-only and must not imply real audio metering.

## Data Model Notes

For this UI shell, mixer control values may remain local UI state or mock arrangement state.

Do not introduce persistent mixer semantics unless the implementation also updates the data model intentionally. Future persisted mixer data may look like:

```ts
export interface TrackMixerState {
  trackId: string;
  volumeDb: number;
  pan?: number;
  muted: boolean;
  solo: boolean;
  effectSlots: EffectSlotState[];
}

export interface EffectSlotState {
  id: string;
  kind: "placeholder" | "filter" | "delay" | "reverb" | string;
  enabled: boolean;
}
```

Actual persisted mixer state should be introduced together with audio routing or a dedicated model feature, not silently in the UI shell.

## Future Audio Routing Notes

Future mixer routing should use Web Audio nodes owned by the audio engine, not React components.

Expected future routing shape:

- Track playback sources route into track gain nodes.
- Track gain nodes route into a master gain node.
- Mute and solo affect gain/routing in the audio engine.
- Level meters read runtime signal data from audio-engine-owned nodes.
- Effect slots map to audio-engine-managed effect nodes.

This feature only prepares the UI surface for that future work.

## Done when

- `SONG` mode shows the arrangement timeline and a bottom dock mixer panel.
- `PAT` mode still shows the current clip editor.
- Existing transport and project sidebar remain visible.
- The mixer panel renders track channel strips aligned with the arrangement track concept.
- A master channel strip is present or the PR explains why it was deferred.
- Volume faders update visible/local state.
- Mute and solo buttons toggle visible/local state.
- Level meters render as placeholder or mock visual meters.
- Basic effect slots render as clearly nonfunctional placeholders.
- Channel strips remain usable when there are more tracks than horizontal space.
- The app shell avoids document-level scrolling.
- No real audio routing, gain node control, metering, or effects are implied by the UI.
- Relevant docs and tests are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Toggle to `SONG` mode and confirm the arrangement timeline remains visible.
- Confirm the bottom dock mixer panel appears below the timeline.
- Confirm track channel strips render with track names, faders, meters, mute, solo, and effect slots.
- Confirm faders update their visible value.
- Confirm mute and solo toggle visual state.
- Confirm level meters are visually present but not represented as real audio meters.
- Confirm channel strips scroll inside the mixer panel if needed.
- Confirm `PAT` mode remains unchanged.
- Confirm no document-level scrolling is introduced.

## PR notes

- Reference issue #34.
- Explain the mixer panel layout and component structure.
- State clearly that this is a UI shell only.
- Mention that real audio routing, metering, mute/solo behavior, and effects are deferred.
- Include screenshots or a short recording if practical.
