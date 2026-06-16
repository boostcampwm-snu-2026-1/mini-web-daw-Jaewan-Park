# Feature: 18 IndexedDB Project Persistence

## Status
Done

## Goal

Persist the user's current project in the browser so a refresh or reopened tab can restore clips, arrangement data, mixer settings, imported sample metadata, and imported sample audio bytes.

## Context

The app is browser-first and project data must remain serializable. Runtime audio objects such as `AudioContext`, `AudioBuffer`, node graphs, object URLs, and decoded sample caches must not be stored in project JSON.

Imported audio files need separate durable storage because object URLs and decoded buffers are session-only. IndexedDB is the first local persistence target.

## Scope

Included:

- Add an IndexedDB persistence layer under `src/persistence/`.
- Store a versioned project document for the active project.
- Store imported sample metadata in serializable project state.
- Store imported sample file bytes or blobs in IndexedDB using stable sample IDs.
- Restore the last active project on app startup.
- Rebuild runtime audio caches from stored blobs only when needed.
- Add debounced autosave for project edits.
- Show minimal save status, such as saved, saving, or save failed.
- Add a baseline migration/version field for stored project documents.
- Handle unavailable storage or quota errors with visible user feedback.

Excluded:

- Cloud sync.
- User accounts.
- Multi-device collaboration.
- A full project browser or multi-project dashboard.
- File-system project export/import.
- Final audio rendering/export.
- Storing `AudioBuffer`, `AudioNode`, `File`, or object URL values in project JSON.

## Constraints

- Keep project JSON serializable.
- Use stable IDs to connect project sample metadata to IndexedDB blobs.
- Keep persistence separate from React rendering and audio scheduling.
- Do not make the audio engine depend on IndexedDB.
- Do not introduce a runtime dependency unless the implementation clearly needs it and the PR explains why.
- Tests may use lightweight mocks or adapters for IndexedDB behavior.

## Done when

- Refreshing the browser restores the active project state.
- Imported WAV clips can still be played after refresh if their blobs were saved successfully.
- Autosave does not block UI interactions.
- Save failures are visible and do not corrupt in-memory state.
- Stored project records include a schema version.
- Runtime audio caches are rebuilt from persistent data rather than serialized directly.

## Verification

Run:

- `npm run typecheck --if-present`
- `npm run lint --if-present`
- `npm run test --if-present`
- `npm run build --if-present`

Manual check:

- Create or modify a clip.
- Import a WAV file.
- Place clips in the arrangement.
- Refresh the page.
- Confirm the project, clips, placement, and imported audio references are restored.
- Confirm the console has no IndexedDB or decoding errors.

## PR notes

- Summarize the IndexedDB stores and schema version.
- Explain what is persisted and what remains runtime-only.
- Mention any browser storage limitations or quota behavior.
