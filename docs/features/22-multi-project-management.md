# Feature: 22 Multi-project Management

## Status
In Review

## Goal

Allow users to manage more than one browser-local project instead of being limited to a single hard-coded active project.

## Context

The current app persists one active project in IndexedDB using a fixed `ACTIVE_PROJECT_ID`. The transport bar displays `Project 1`, and there is no project-level UI for creating, switching, renaming, or deleting separate songs.

Multiple local projects should stay browser-first and lightweight. This feature is not a cloud account system or a file browser. It should extend the existing IndexedDB persistence model so users can keep separate sketches in the same browser profile.

## Scope

Included:

- Store multiple serializable project documents in IndexedDB.
- Store the active project ID separately from project documents.
- Restore the last active project on app startup.
- Add a transport bar project menu that shows the active project name.
- Support creating a new blank project.
- Support switching between existing projects.
- Support renaming the active project.
- Support deleting a project with confirmation.
- Stop playback and audio preview before switching projects.
- Keep imported sample blobs scoped to the owning project so projects cannot collide on sample IDs.
- Migrate the existing single active project into the multi-project shape where practical.

Excluded:

- Cloud sync or user accounts.
- Cross-device collaboration.
- File-system project export/import.
- Project templates beyond the current default blank project.
- Project duplication unless it is trivial after the base workflow exists.
- A full project dashboard page.
- Sharing projects between browsers or devices.

## Constraints

- Project data must remain serializable.
- Runtime objects such as `AudioContext`, `AudioBuffer`, `File`, object URLs, active source nodes, and mixer nodes must not be stored in project JSON.
- Switching projects must not let pending autosave write the old project into the new project ID.
- Persistence code should stay separate from React rendering and audio scheduling.
- The audio engine must not depend on IndexedDB or project menu UI.
- Use CSS Modules and semantic design tokens for project menu UI.
- Do not introduce a runtime dependency for IndexedDB or menu behavior unless the implementation clearly justifies it.

## Proposed Model

Use a stable project ID per project instead of one fixed `ACTIVE_PROJECT_ID`.

Illustrative shape:

```ts
export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectCollectionState {
  activeProjectId: string;
  projects: ProjectSummary[];
}
```

`PersistedProjectDocument.id` should become the actual project ID. Existing project document fields such as clips, arrangement tracks, clip instances, sample metadata, tempo, mixer state, arrangement length, and loop range remain serializable project data.

Imported sample blob storage should include project ownership. Acceptable first-pass strategies:

- Use a composite blob key such as `${projectId}:${sampleId}`.
- Or add `projectId` to each imported sample blob record and query/delete by project ID if IndexedDB indexes are added.

The implementation should choose the smaller safe migration path and document it in the PR.

## UI Direction

The project menu belongs in the transport bar near the current project name/save status area.

The first project menu should include:

- Current project name.
- List of local projects.
- `New Project`.
- `Rename Project`.
- `Delete Project`.

Switching projects should close the menu, stop playback/preview, save or flush the current project state if practical, load the selected project, and reset selection to valid clip/instrument defaults.

## Done when

- Users can create, select, rename, and delete browser-local projects from the transport bar.
- Refreshing the browser restores the last active project.
- Each project restores its own clips, arrangement, mixer state, sample metadata, and imported sample blobs.
- Deleting a project requires confirmation and does not delete another project's sample blobs.
- Existing single-project IndexedDB data is preserved as an initial project after migration where practical.
- Autosave writes to the intended project after creating or switching projects.
- The transport bar displays the active project name from project state, not a hard-coded value.
- The PR documents any migration limitations.

## Verification

Run:

- `npm run typecheck --if-present`
- `npm run lint --if-present`
- `npm run test --if-present`
- `npm run build --if-present`

Manual check:

- Start from an existing single-project browser profile if possible.
- Confirm the old project appears as a local project after migration.
- Create a second project and verify it starts blank.
- Rename a project and refresh the browser.
- Switch between projects and confirm clips, arrangement placements, mixer state, and tempo remain separate.
- Import a WAV file in one project, refresh, and verify the imported audio belongs only to that project.
- Delete a project and confirm another project still loads correctly.

## PR notes

- Summarize IndexedDB store/key changes.
- Explain active project ID persistence.
- Explain imported sample blob scoping and deletion behavior.
- Mention any unsupported project operations, such as duplication or file export/import.
