# AGENTS.md

## Project Overview

This repository is for a browser-based mini DAW built with Vite, React, TypeScript, CSS Modules, and the Web Audio API.

The product is a clip-based electronic music creation tool. The first major milestone is a 1-bar hybrid clip editor with drum step sequencing, basic piano roll editing, and loop playback. Future work may add arrangement editing and desktop packaging with Electron or Tauri, but the initial target is a browser app.

## Repository Layout

Expected source layout after the scaffold task:

- `src/app/`: app shell, providers, root composition.
- `src/components/`: shared reusable React components.
- `src/features/`: feature-specific UI and orchestration.
- `src/audio/`: Web Audio engine, transport, scheduling, sample playback.
- `src/model/`: serializable project types and model transformations.
- `src/persistence/`: import, export, storage, and migration helpers.
- `src/utils/`: pure utilities such as tick/time conversion.
- `src/styles/`: global CSS, tokens, and shared style primitives.
- `docs/`: product, architecture, data model, audio, UI, testing, and feature specs.

Preserve the existing structure unless a refactor is clearly required by the task.

## Commands

Use npm unless the repository already clearly uses another package manager.

Intended project commands:

```text
Install: npm install
Dev: npm run dev
Type check: npm run typecheck
Lint: npm run lint
Test: npm run test
Build: npm run build
```

If these scripts do not exist yet, future scaffold work must add them. CI uses `--if-present` until the Vite scaffold exists.

## Engineering Conventions

- Prefer small, focused, reviewable changes.
- Keep React UI separate from audio scheduling logic.
- Do not mix persistence, UI rendering, and audio scheduling in the same module.
- Keep project data serializable.
- Store musical time in ticks, not seconds.
- Use TypeScript types for project data, audio engine APIs, and feature boundaries.
- Follow `docs/code-conventions.md` for naming, file organization, TypeScript, React, CSS Modules, design tokens, domain naming, tests, and comments.
- Prefer pure utilities for tick math, model transformations, and scheduler calculations.
- Do not introduce new production dependencies without a clear reason.
- Do not rewrite large files unless required.
- Do not implement unrelated features while working on a feature spec.
- Do not change the project data model without updating `docs/data-model.md`.

## Audio Rules

- React UI must not own exact audio timing.
- Schedule audio against `AudioContext.currentTime`.
- Use a lookahead scheduler for sequenced playback.
- UI cursors and playheads may use `requestAnimationFrame`, but not for exact audio scheduling.
- Store musical time in ticks. The documented default PPQ is 480.
- Do not store `AudioBuffer` objects directly in project JSON.
- Runtime audio objects such as `AudioContext`, `AudioBuffer`, nodes, and decoded samples belong in audio runtime caches, not serializable project state.
- Create a new `AudioBufferSourceNode` for each repeated one-shot sample playback.
- The audio engine should expose a small typed API to the UI.

## CSS Modules Rules

- Use CSS Modules for component styles.
- Keep global CSS limited to resets, base document styles, and design tokens.
- Use CSS custom properties for shared colors, spacing, typography, and timing values.
- Define primitive design tokens first, then define semantic tokens from those primitives.
- Component CSS Modules should use semantic tokens. Do not reference primitive color, spacing, typography, or radius tokens directly in component styles unless there is a documented exception.
- Dynamic editor geometry such as note positions, note widths, and grid coordinates may use inline styles when values are computed at runtime.
- Do not add a visual design system dependency at this stage unless a task explicitly justifies it.

## Issue Workflow

- Use GitHub Issues as the task queue for feature work, bugs, and larger refactors.
- Follow `PLANS.md` `Active Issue Order` when choosing the next issue unless the user gives a different priority.
- Prefer one issue per feature spec or focused bug.
- Link issues to feature documents under `docs/features/` when applicable.
- Use branch names that include the issue number when possible:
  - `feat/<issue-number>-<short-name>`
  - `fix/<issue-number>-<short-name>`
  - `docs/<issue-number>-<short-name>`
- PRs should reference the issue they address.
- Use `Closes #<issue-number>` only when the PR fully completes the issue.
- Do not close issues unless the acceptance criteria are met.
- Do not create duplicate issues. Search existing open issues first when possible.
- Do not create issues for tiny typo fixes or trivial cleanup unless requested.

## Git and PR Expectations

- Work on a focused branch when possible.
- Open PRs against `develop` by default unless a maintainer explicitly requests another base branch.
- Keep commits scoped to the task.
- Use conventional commit messages when practical.
- PR summaries should explain what changed, how it was tested, and known limitations.
- Do not remove tests or checks to make a task pass.
- Do not merge PRs automatically.

## Constraints and Do-Not Rules

- Do not implement production DAW features unless the active task asks for them.
- Do not add sample files unless the active task asks for them.
- Do not add `CHANGELOG.md` for now.
- Do not store runtime-only audio objects in project JSON.
- Do not make broad refactors during feature work.
- Do not introduce new runtime dependencies without documenting why they are needed.
- Do not couple React components to Web Audio scheduling internals.
- Do not change documented model semantics without updating the relevant docs.

## Definition of Done

- Requested behavior implemented.
- Relevant docs updated if needed.
- TypeScript passes.
- Lint passes.
- Tests pass.
- Production build passes.
- PR summary includes testing and known limitations.

## Verification

Run applicable checks before opening a PR:

```bash
npm run typecheck --if-present
npm run lint --if-present
npm run test --if-present
npm run build --if-present
```

If the project scaffold does not exist yet, record that the npm scripts are not available and that `docs/features/01-project-scaffold.md` must add them.
