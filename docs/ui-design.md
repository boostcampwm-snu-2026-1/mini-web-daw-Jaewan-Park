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

## Accessibility Basics

- Use semantic buttons for step toggles.
- Provide keyboard access where practical.
- Keep visible focus states.
- Use labels or accessible names for icon-only controls.
- Avoid color as the only indicator of state.

## Dependencies

Do not require a visual design system dependency at this stage. Add UI dependencies only when they solve a clear implementation problem and the task justifies the cost.
