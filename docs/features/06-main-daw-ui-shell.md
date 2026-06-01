# Feature: 06 Main DAW UI Shell

## Status
Planned

## Goal

Convert the provided Tailwind-based DAW UI prototype into a working Vite + React + TypeScript UI shell implemented with CSS Modules.

## Context

The app needs a full-screen dark DAW-style interface before later sequencer, piano roll, and scheduler work is connected to real project/audio behavior. The provided prototype should be treated as a visual reference only. The project remains CSS Modules-based and must preserve the existing primitive-to-semantic design token policy.

This task may be scheduled before the lookahead scheduler because it gives later drum sequencer and piano roll work a stable UI structure to attach to.

## Scope

Included:
- Full-screen dark app layout.
- Top transport bar.
- Left project and clip sidebar.
- Main drum step sequencer panel.
- Piano roll panel.
- Velocity editor.
- Local UI state for play/stop, BPM, PAT/SONG mode, sidebar selection, and drum step toggles.
- Component-level CSS Modules.
- Shared design tokens in `src/styles/tokens.css`.
- Google Inter and Material Symbols font loading if needed.
- Documentation updates for UI reference policy.

Excluded:
- Tailwind installation.
- Tailwind CDN or Tailwind utility classes in React components.
- New Web Audio engine work.
- Audio playback behavior.
- Lookahead scheduler.
- Persistence, import/export, or IndexedDB.
- Arrangement view.
- Real piano roll editing.
- Drag and drop.
- Mixer, routing, or effects.

## Constraints
- Use the prototype as visual reference only.
- Do not add Tailwind or a React icon package.
- Preserve the primitive/semantic token model:
  - primitive tokens define raw values;
  - semantic tokens reference primitives;
  - component CSS Modules use semantic tokens.
- Use inline styles only for dynamic editor geometry such as note positions, note widths, note top values, grid coordinates, and velocity bar heights.
- Do not remove the existing audio sample playback engine or bundled sample assets.
- Keep React UI separate from exact audio scheduling.
- Keep implementation scoped to a static/interactable shell with local state.

## Done when
- The app renders a full-screen dark DAW interface without document-level scrolling.
- The top transport bar is visible.
- Play and stop buttons update transport visual state.
- BPM slider updates the displayed BPM.
- PAT/SONG toggle updates selected mode.
- Sidebar project, clip, and instrument items render, and selection state updates if practical.
- Drum sequencer renders four lanes and 16 step buttons per lane.
- Drum step buttons toggle active state using local React state.
- Piano roll renders a keyboard, grid, demo notes, and velocity editor.
- No Tailwind dependency, Tailwind config, or Tailwind CDN is added.
- Components use semantic CSS Module class names instead of Tailwind utility-class-heavy markup.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Start `npm run dev` and inspect the UI.
- Confirm full-screen layout does not scroll the document.
- Confirm transport, BPM, PAT/SONG, sidebar selection, and drum step toggle interactions update visually.
- Confirm piano roll and velocity editor render.
- Confirm no Tailwind package or CDN script was added.

## PR notes
- Summarize how the Tailwind prototype was converted to CSS Modules.
- List major components added or changed.
- Mention that audio playback, real piano roll editing, scheduler behavior, and persistence are intentionally excluded.
- Include screenshots or a short recording if practical.
