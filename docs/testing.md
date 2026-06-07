# Testing Strategy

## Required Checks

Run these checks before opening a PR when the scripts exist:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

CI uses `--if-present` while the repository is still before the Vite scaffold.

## Test Strategy

- Pure utilities: unit tests.
- Tick/time conversion: unit tests.
- Data model transformations: unit tests.
- Pitched instrument metadata and sample-zone mapping: unit tests.
- Tempo control and scheduler tempo update behavior: unit tests where practical.
- Sustain loop point calculations: unit tests.
- Sampler sustain metadata validation and fallback decisions: unit tests.
- Scheduler calculations: unit tests where possible.
- UI interactions: component tests later.
- Critical flows: browser end-to-end tests later, after the UI and workflows are stable enough to justify the framework.

## Test Source Layout

- `src/`: production code only.
- `tests/unit/`: unit tests for pure utilities, scheduler calculations, model transformations, and isolated module behavior.
- `tests/integration/`: integration tests for multi-module workflows when needed.

Do not add an end-to-end test directory or framework yet. Add it only when a future feature spec needs browser flow coverage.

Test files should use `*.test.ts` or `*.test.tsx`. Keep paths grouped by the production area they cover, for example:

```text
tests/unit/audio/lookahead-scheduler.test.ts
tests/unit/audio/sampler-sustain.test.ts
tests/unit/utils/tick-time.test.ts
```

`tsconfig.test.json` owns TypeScript settings for tests. The root `tsconfig.json` should reference it so `npm run typecheck` checks test files as well as production code.

## High-risk Areas

- Tick-to-seconds conversion.
- Loop boundaries.
- Pause/resume tick offsets.
- Playhead wrapping at loop boundaries.
- BPM changes while stopped, paused, and playing.
- Pitched instrument selection.
- Sample start offsets, optional sustain loop points, and note release behavior.
- Sampler sustain fallback behavior when loop metadata is missing or invalid.
- Clip duplication.
- Sample import.
- Project export/import.
- Scheduler timing.

## Manual Testing Guidance for Audio Features

Manual audio checks should verify:

- Audio starts only after user interaction when required by the browser.
- One-shot samples play repeatedly without reusing the same source node.
- Loop playback does not double-trigger events at the loop boundary.
- UI playhead movement roughly matches audible playback.
- Pause preserves the runtime playhead position, resume continues from that position, and stop resets to the start.
- BPM changes while stopped affect the next playback start.
- BPM changes while paused affect resume from the paused tick.
- BPM changes while playing affect future scheduled drum and note events without using UI timers for exact playback.
- Starting, stopping, and restarting transport leaves no stuck sounds.
- Long sample-based piano notes behave as documented for the selected instrument. For the current Iowa Piano implementation, they should not retrigger or sound like repeated strikes.
- When sampler sustain metadata exists, long sample-based notes should sustain without obvious repeated attacks as much as the sample material allows.
- If sampler sustain metadata is missing or invalid, sample-based notes should fall back to one-shot playback rather than stuck or unstable sustain.
- Instrument switching changes piano roll playback sound without mutating existing note events.
- Tempo changes behave as documented for the current milestone.

Use headphones or speakers at a safe volume. Record browser, OS, and device details when reporting audio timing issues.

## Test Integrity

Do not remove tests or checks just to make a task pass. If a test is obsolete, update it with the code change and explain why in the PR.
