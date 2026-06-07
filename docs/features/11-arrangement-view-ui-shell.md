# Feature: 11 Arrangement View UI Shell

## Status
Planned

## Goal

Add an arrangement view UI shell that appears when the transport mode is set to `SONG`.

Keep the existing top transport bar and left project sidebar. The `PAT` mode should continue to show the current 1-bar hybrid clip editor.

## Context

The app already has a `PAT` / `SONG` toggle in the transport bar. `PAT` currently represents the focused pattern or clip editor workflow. `SONG` should start to represent the later arrangement workflow where clips are placed horizontally in time and vertically across tracks.

A Google Stitch prototype provides a visual reference for the arrangement view. It shows:

- Arrangement toolbar.
- Timeline ruler with bar numbers.
- Fixed left track headers.
- Scrollable grid with track lanes.
- Demo clip blocks placed on the timeline.
- Bottom scrollbar and zoom area.

The prototype uses Tailwind and includes layout issues, including track and clip alignment problems. Treat it as visual reference only.

## Scope

Included:
- Preserve the existing top transport bar.
- Preserve the existing left project sidebar.
- Render the current clip editor when mode is `PAT`.
- Render an arrangement view UI shell when mode is `SONG`.
- Add an arrangement toolbar with title and snap display.
- Add a timeline ruler with bar numbers.
- Add fixed-width track headers.
- Add a scrollable timeline grid with horizontal track lanes and vertical bar/beat lines.
- Add a few static/demo clip blocks to communicate intended layout.
- Add a bottom horizontal scrollbar or scrollbar-like visual area and zoom placeholder.
- Keep track headers, grid rows, and clip blocks vertically aligned through shared row-height constants.
- Keep ruler, grid columns, and clip left/width values horizontally aligned through shared timeline geometry constants.
- Use CSS Modules and semantic design tokens.
- Use inline styles only for dynamic arrangement geometry such as clip `left`, clip `width`, clip `top`, grid width, and playhead position.
- Update relevant UI/design docs.

Excluded:
- Real arrangement data model changes.
- Persisted `ClipInstance` editing.
- Arrangement playback.
- Timeline playhead behavior beyond optional static visual placeholder.
- Drag and drop arrangement editing.
- Clip duplication, clip splitting, or clip creation in the arrangement.
- Real audio clips or generated waveforms.
- Track mute, solo, arm, or routing behavior beyond nonfunctional visual controls.
- Arrangement zoom implementation beyond a visual placeholder.
- Tailwind installation, Tailwind config, Tailwind CDN, or Tailwind utility-class-heavy React markup.

## Constraints

- React UI must not own exact audio timing.
- Store musical arrangement time in ticks when real arrangement data is introduced later.
- Keep current clip editor behavior unchanged in `PAT` mode.
- Preserve existing transport and sidebar components instead of duplicating them.
- Do not introduce runtime dependencies unless clearly justified.
- Follow the primitive-to-semantic token policy.
- Component CSS Modules should use semantic tokens, not raw primitive values, unless there is a documented exception.
- Do not copy the Stitch HTML directly into React.

## UI Reference Policy

Use the provided Stitch prototype for visual direction only:

- Dark DAW workspace.
- Compact dense layout.
- Muted lime and teal accents.
- Thin borders and clear panel separation.
- Arrangement toolbar.
- Fixed track header column.
- Timeline ruler and grid.
- Clip blocks with small headers and simple content hints.

Correct prototype issues during implementation. In particular, track headers, timeline lanes, and clip blocks must align exactly.

## Geometry Approach

Define shared arrangement geometry constants in component code or a local feature helper:

- Track header width.
- Track row height.
- Ruler height.
- Bar width.
- Beat subdivision width.
- Timeline content width.

Use those constants to compute both CSS grid/background dimensions and clip block positions. Do not duplicate unrelated magic numbers across track headers, grid rows, and clips.

## Done when

- Selecting `PAT` shows the existing hybrid clip editor.
- Selecting `SONG` shows the arrangement view UI shell.
- The existing transport bar and project sidebar remain visible in both modes.
- The arrangement view includes toolbar, ruler, track headers, timeline grid, demo clips, and bottom scrollbar/zoom placeholder.
- Track headers and timeline lanes align vertically.
- Clip blocks align to track rows and timeline columns.
- Horizontal scrolling, if present, is contained inside the arrangement panel.
- The app shell still avoids document-level scrolling.
- No Tailwind dependency, config, CDN script, or Tailwind utility-heavy React markup is added.
- Relevant docs are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Start the dev server.
- Confirm `PAT` mode still renders the current clip editor.
- Toggle to `SONG` and confirm the arrangement view renders.
- Confirm the existing transport and sidebar remain visible.
- Confirm track headers, grid rows, clip blocks, and ruler lines align.
- Confirm the page itself does not scroll.
- Confirm horizontal scrolling stays inside the arrangement panel.
- Confirm Tailwind was not added.

## PR notes

- Explain how the Stitch prototype was converted into CSS Modules.
- Mention that arrangement data model, persistence, editing, and playback are intentionally excluded.
- Describe how shared geometry constants keep track rows and clips aligned.
- Include screenshots or a short recording if practical.
