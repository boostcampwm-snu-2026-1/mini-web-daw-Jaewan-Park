# Feature: 01 Project Scaffold

## Status
Planned

## Goal

Create the Vite + React + TypeScript app structure for the browser-based mini DAW.

## Context

The repository currently contains planning and workflow documentation. This task should establish the app scaffold, package scripts, CSS Modules baseline, and initial source folders without implementing DAW features.

## Scope

Included:
- Create a Vite + React + TypeScript scaffold.
- Use npm as the package manager unless the repository clearly changes package managers.
- Add scripts for `dev`, `typecheck`, `lint`, `test`, and `build`.
- Add initial `src/` folders that match `docs/architecture.md`.
- Add baseline CSS Modules support and global styles location.
- Add initial design token files using primitive tokens and semantic tokens.
- Add a minimal app shell that does not claim DAW functionality.

Excluded:
- Audio engine implementation.
- Drum sequencer implementation.
- Piano roll implementation.
- Sample files.
- Arrangement view.
- Persistence features.

## Constraints
- Use Vite, React, TypeScript, CSS Modules, and Web Audio API as the planned stack.
- Component CSS Modules should use semantic design tokens, not primitive token values directly.
- Do not introduce unnecessary production dependencies.
- Preserve existing docs and workflow files.
- Keep changes small and reviewable.

## Done when
- The app scaffold builds with Vite.
- Package scripts exist for the documented commands.
- Initial source folders exist.
- CSS Modules are usable by components.
- Initial design tokens include primitive values and semantic aliases.
- The app shell clearly indicates early scaffold status without overclaiming features.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Start `npm run dev` and confirm the app shell renders in the browser.

## PR notes
- Summarize scaffold choices.
- Mention any package scripts or checks that are intentionally minimal.
- Note that DAW features are not implemented in this task.
