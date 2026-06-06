# UI and Design

## CSS Modules Convention

Use CSS Modules for component-level styles:

```text
ComponentName.tsx
ComponentName.module.css
```

Class names should describe the component part or state, such as `root`, `lane`, `stepButton`, `active`, or `noteBlock`.

## Global Styles Policy

Keep global CSS minimal:

- CSS reset or normalization.
- `html`, `body`, and `#root` sizing.
- Base font rendering.
- Design tokens as CSS custom properties.

Do not put feature-specific component styles in global CSS.

## Design Token Policy

Use CSS variables for shared values:

- Colors.
- Spacing.
- Border radius.
- Typography.
- Z-index layers.
- Timing constants for transitions.

Tokens should live in `src/styles/` after the scaffold exists.

Use a two-layer token model:

- Primitive tokens define raw palette, spacing, typography, radius, and timing values.
- Semantic tokens define product meaning by referencing primitive tokens.

Example:

```css
:root {
  --color-gray-950: #0f172a;
  --color-blue-500: #3b82f6;
  --space-2: 8px;
  --radius-2: 6px;

  --color-app-background: var(--color-gray-950);
  --color-control-accent: var(--color-blue-500);
  --space-control-gap: var(--space-2);
  --radius-control: var(--radius-2);
}
```

Component CSS Modules should use semantic tokens:

```css
.button {
  background: var(--color-control-accent);
  border-radius: var(--radius-control);
}
```

Do not reference primitive tokens directly in component styles unless there is a documented exception. This keeps component styling tied to product meaning instead of raw implementation values.

## Initial Layout

The first usable screen should focus on the clip editor:

- Transport bar.
- Selected clip editor.
- Drum step sequencer.
- Piano roll.

Do not default to a marketing landing page.

## Later Layout

Later milestones can add:

- Clip library.
- Arrangement view.
- Selected clip editor panel.

The arrangement should support horizontal time and vertical track lanes when that milestone arrives.

## Component Naming Recommendations

Prefer names that match the product domain:

- `TransportBar`
- `ClipEditor`
- `DrumStepSequencer`
- `DrumLane`
- `StepButton`
- `PianoRoll`
- `NoteBlock`
- `ArrangementView`

Feature-specific components should live under `src/features/` unless they are truly reusable.

## Dynamic Editor Geometry Policy

Inline styles are acceptable for computed editor geometry, including:

- Note positions.
- Note widths.
- Grid coordinates.
- Playhead transform values.

Keep static appearance in CSS Modules. Keep dynamic numeric layout derived from ticks, pitch, and grid dimensions.

## Playhead Display

Clip editors may render a vertical playhead to show the current runtime transport position.

- The playhead position should be derived from tick position and editor dimensions.
- Use `requestAnimationFrame` for visual updates when playback is active.
- Keep the playhead as visual feedback only; it must not drive exact audio scheduling.
- Use CSS Modules and semantic design tokens for static playhead styling.
- Inline styles are acceptable for computed playhead geometry such as `left` or `transform`.
- When stopped, the playhead should reset to the start of the selected clip. When paused, it should remain at the paused tick.

## Piano Roll Editing

The initial piano roll should use a compact C4-C5 pitch range that matches the bundled University of Iowa piano sample files.

- Render 13 pitch rows from C5 down to C4.
- Render 32 columns across the 1-bar clip.
- Use left-click to create a short note.
- Use left-click drag on empty grid space to create a longer note.
- Use left-click drag on an existing note to move its pitch and start tick.
- Use right-click on an existing note to delete it.
- Store the result in serializable `noteEvents`; do not store UI geometry as project data.
- Use inline styles only for computed note geometry such as top, left, width, and height.

## Sample Display Names

When displaying bundled drum sample names in the UI, derive the label from the `.wav` file name:

- Remove the `.wav` extension.
- Replace underscores (`_`) with spaces.
- Convert the result to uppercase.

Example: `Fred_Kick_1.wav` displays as `FRED KICK 1`.

## Drum Lane Editing

Drum lane names can act as sample selectors. Clicking a lane name may open a compact scrollable list of bundled drum samples. Render this menu as a popover above clipping editor containers when needed so it is not cut off by panel or workspace overflow. Selecting a sample should update the lane's visible label, the lane's `sampleId`, and existing drum events for that lane in serializable clip state.

Drum lanes may be reordered vertically with drag and drop. The visual order should come from the selected clip's ordered `drumLanes` array rather than a hard-coded component order.

## UI Reference Policy

If a design prototype uses Tailwind, inline styles, or CDN assets, treat it as visual reference only. Convert the design into semantic React components, CSS Modules, and shared CSS variables.

- Do not add Tailwind, Tailwind config, or Tailwind CDN scripts unless a future architecture decision explicitly changes the styling strategy.
- Do not copy utility-class-heavy HTML directly into React components.
- Preserve the primitive/semantic token model in `src/styles/tokens.css`.
- Component styles should live in matching `.module.css` files.
- Component CSS Modules should reference semantic tokens, not primitive tokens, unless there is a documented exception.
- Inline styles remain acceptable for dynamic editor geometry such as note positions, widths, grid coordinates, and velocity heights.

For the main DAW UI shell, the Tailwind prototype should inform visual direction only: dark DAW workspace, compact editor spacing, muted lime active states, muted teal MIDI notes, thin borders, and clear panel separation.

## Main UI Shell Styling

The initial main DAW UI shell converts the Tailwind-based prototype into React components with CSS Modules.

- The project remains CSS Modules-based.
- Design tokens live in `src/styles/tokens.css`.
- Primitive tokens define raw values and semantic tokens reference those primitives.
- Component styles live in matching `.module.css` files and should use semantic tokens.
- Dynamic editor geometry may use inline styles for note positions, note widths, note top values, grid coordinates, and velocity heights.
- Tailwind should not be added unless a future architecture decision explicitly changes the styling strategy.

## Accessibility Basics

- Use semantic buttons for step toggles.
- Provide keyboard access where practical.
- Keep visible focus states.
- Use labels or accessible names for icon-only controls.
- Avoid color as the only indicator of state.

## Dependencies

Do not require a visual design system dependency at this stage. Add UI dependencies only when they solve a clear implementation problem and the task justifies the cost.
