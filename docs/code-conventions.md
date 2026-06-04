# Code Conventions

## Purpose

Use these conventions to keep agent-authored code consistent across features. Prefer existing local patterns when they are more specific than this document.

## Files and Directories

- React component files use `PascalCase.tsx`: `TransportBar.tsx`, `PianoRoll.tsx`.
- Component CSS Modules use the same base name: `TransportBar.module.css`.
- Feature folders use `kebab-case`: `drum-step-sequencer`, `piano-roll`.
- General TypeScript utility files use `kebab-case.ts`: `tick-time.ts`, `sample-loader.ts`.
- Barrel files may use `index.ts` only when they simplify imports without hiding ownership.
- Unit test files use `*.test.ts` or `*.test.tsx` under `tests/unit/`, grouped by the production area they cover.

## TypeScript Naming

- Types, interfaces, classes, enums, and React components use `PascalCase`.
- Functions, variables, object properties, and module-level helpers use `camelCase`.
- True constants use `UPPER_SNAKE_CASE`: `DEFAULT_PPQ`, `BAR_TICKS`, `STEP_TICKS`.
- Generic type parameters should be short and meaningful: `T`, `TEvent`, `TClip`.
- Avoid abbreviations unless they are common in the domain, such as `MIDI`, `PPQ`, `BPM`, or `ID`.

## React Components

- Component names should match product nouns: `TransportBar`, `ClipEditor`, `DrumStepSequencer`.
- Event handlers use `handleX`: `handlePlayClick`, `handleStepToggle`.
- Custom hooks use `useX`: `useTransportState`.
- Components should not own exact audio timing or scheduling logic.
- Keep feature-specific UI under `src/features/` unless it is clearly reusable.
- Keep shared presentational components under `src/components/`.

## Domain Naming

- Tick values should use `Tick` or a `Ticks` suffix when they represent a duration or length:
  - `startTick`
  - `durationTicks`
  - `lengthTicks`
- Seconds should be explicit:
  - `durationSeconds`
  - `lookaheadSeconds`
  - `scheduleAheadSeconds`
- Web Audio clock values should make audio-time semantics clear:
  - `audioStartTime`
  - `scheduledAudioTime`
- IDs use `Id` suffix in property names:
  - `clipId`
  - `trackId`
  - `sampleId`
- Booleans should start with `is`, `has`, `can`, or `should`:
  - `isPlaying`
  - `hasSelection`
  - `canResizeNote`
  - `shouldLoop`

## CSS Modules

- CSS Module class names use `camelCase`: `root`, `transportBar`, `stepButton`, `activeStep`.
- Prefer product or component part names over visual-only names.
- Keep static appearance in CSS Modules.
- Runtime editor geometry may use inline styles when values are derived from ticks, pitch, or grid dimensions.
- Do not put component-specific styles in global CSS.

## Design Tokens

- Define primitive tokens first: raw palette, spacing, typography, radius, and timing values.
- Define semantic tokens from primitive tokens.
- Component CSS Modules should use semantic tokens, not primitive tokens.
- Primitive token example: `--color-neutral-900`, `--space-4`, `--radius-2`.
- Semantic token example: `--color-app-background`, `--space-control-gap`, `--radius-control`.
- Document exceptions when component code must reference a primitive token directly.

## Tests

- Test names should describe behavior, not implementation.
- Keep production source files under `src/`; place unit tests under `tests/unit/`.
- Use `tests/integration/` only when a task needs multi-module workflow coverage.
- Do not add an end-to-end test framework until a feature spec calls for browser flow testing.
- Prefer examples such as:
  - `converts ticks to seconds at 120 bpm`
  - `does not schedule duplicate events at the loop end`
- Unit-test pure utilities, tick/time conversion, data model transformations, and scheduler calculations.
- Add component or end-to-end tests later when UI behavior becomes stable enough to justify them.

## Comments

- Prefer clear names and small functions over explanatory comments.
- Add comments only where the reason is not obvious from the code.
- Avoid comments that restate the next line of code.
- Use comments to explain timing assumptions, loop-boundary decisions, browser audio constraints, or non-obvious model migrations.
