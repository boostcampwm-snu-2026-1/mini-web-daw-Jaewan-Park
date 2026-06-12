import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { Icon } from "../../components";
import {
  PITCHED_INSTRUMENTS,
  type HybridClip,
  type PitchedInstrumentId,
} from "../../model";
import styles from "./ProjectSidebar.module.css";

export type InstrumentId = "drums" | PitchedInstrumentId;

interface ProjectSidebarProps {
  clips: readonly HybridClip[];
  selectedClipId: string;
  selectedInstrumentId: InstrumentId;
  onClipAdd: () => void;
  onClipDelete: (clipId: string) => void;
  onClipRename: (clipId: string, name: string) => void;
  onClipSelect: (clipId: string) => void;
  onInstrumentAdd: (clipId: string, instrumentId: PitchedInstrumentId) => void;
  onInstrumentRemove: (clipId: string, instrumentId: PitchedInstrumentId) => void;
  onInstrumentSelect: (clipId: string, instrumentId: InstrumentId) => void;
}

export function ProjectSidebar({
  clips,
  selectedClipId,
  selectedInstrumentId,
  onClipAdd,
  onClipDelete,
  onClipRename,
  onClipSelect,
  onInstrumentAdd,
  onInstrumentRemove,
  onInstrumentSelect,
}: ProjectSidebarProps) {
  const [addingInstrumentClipId, setAddingInstrumentClipId] =
    useState<string | null>(null);
  const [collapsedClipIds, setCollapsedClipIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [renamingClipId, setRenamingClipId] = useState<string | null>(null);
  const [draftClipName, setDraftClipName] = useState("");
  const shouldIgnoreRenameBlurRef = useRef(false);

  function beginClipRename(clip: HybridClip) {
    shouldIgnoreRenameBlurRef.current = false;
    setAddingInstrumentClipId(null);
    setRenamingClipId(clip.id);
    setDraftClipName(clip.name);
  }

  function cancelClipRename() {
    shouldIgnoreRenameBlurRef.current = true;
    setRenamingClipId(null);
    setDraftClipName("");
  }

  function commitClipRename(clipId: string) {
    if (renamingClipId !== clipId) {
      return;
    }

    onClipRename(clipId, draftClipName);
    shouldIgnoreRenameBlurRef.current = true;
    cancelClipRename();
  }

  function handleRenameBlur(clipId: string) {
    if (shouldIgnoreRenameBlurRef.current) {
      shouldIgnoreRenameBlurRef.current = false;
      return;
    }

    commitClipRename(clipId);
  }

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>, clipId: string) {
    event.preventDefault();
    commitClipRename(clipId);
  }

  function handleRenameKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    clipId: string,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelClipRename();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commitClipRename(clipId);
    }
  }

  function toggleInstrumentPicker(clipId: string) {
    setRenamingClipId(null);
    setCollapsedClipIds((currentClipIds) => {
      const nextClipIds = new Set(currentClipIds);

      nextClipIds.delete(clipId);
      return nextClipIds;
    });
    setAddingInstrumentClipId((currentClipId) =>
      currentClipId === clipId ? null : clipId,
    );
  }

  function toggleClipExpanded(clipId: string) {
    setAddingInstrumentClipId(null);
    setCollapsedClipIds((currentClipIds) => {
      const nextClipIds = new Set(currentClipIds);

      if (nextClipIds.has(clipId)) {
        nextClipIds.delete(clipId);
      } else {
        nextClipIds.add(clipId);
      }

      return nextClipIds;
    });
  }

  return (
    <aside className={styles.sidebar} aria-label="Project sidebar">
      <div className={styles.projectHeader}>
        <p className={styles.sectionLabel}>Project</p>
        <h2 className={styles.projectName}>Project 1</h2>
      </div>

      <nav className={styles.clipBrowser} aria-label="Clips and instruments">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Clips</p>
          <button
            aria-label="Add clip"
            className={styles.iconButton}
            onClick={onClipAdd}
            type="button"
          >
            <Icon name="add" />
          </button>
        </div>

        {clips.map((clip) => {
          const isClipSelected = clip.id === selectedClipId;
          const isClipExpanded = !collapsedClipIds.has(clip.id);
          const availableInstruments = PITCHED_INSTRUMENTS.filter(
            (instrument) => !clip.pitchedInstrumentIds.includes(instrument.id),
          );

          return (
            <div className={styles.clipGroup} key={clip.id}>
              <div
                className={`${styles.clipHeader} ${
                  isClipSelected ? styles.clipHeaderActive : ""
                }`}
              >
                {renamingClipId === clip.id ? (
                  <form
                    className={styles.renameForm}
                    onSubmit={(event) => handleRenameSubmit(event, clip.id)}
                  >
                    <input
                      aria-label={`Rename ${clip.name}`}
                      autoFocus
                      className={styles.renameInput}
                      onBlur={() => handleRenameBlur(clip.id)}
                      onChange={(event) => setDraftClipName(event.target.value)}
                      onKeyDown={(event) => handleRenameKeyDown(event, clip.id)}
                      value={draftClipName}
                    />
                  </form>
                ) : (
                  <>
                    <button
                      aria-expanded={isClipExpanded}
                      aria-label={
                        isClipExpanded
                          ? `Collapse ${clip.name}`
                          : `Expand ${clip.name}`
                      }
                      className={styles.clipExpandButton}
                      onClick={() => toggleClipExpanded(clip.id)}
                      type="button"
                    >
                      <Icon name={isClipExpanded ? "expand_more" : "chevron_right"} />
                    </button>
                    <button
                      className={styles.clipSelectButton}
                      onClick={() => onClipSelect(clip.id)}
                      type="button"
                    >
                      <span>{clip.name}</span>
                    </button>
                  </>
                )}

                <div className={styles.clipActions}>
                  <button
                    aria-label={`Rename ${clip.name}`}
                    className={styles.iconButton}
                    onClick={() => beginClipRename(clip)}
                    type="button"
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    aria-label={`Add instrument to ${clip.name}`}
                    className={styles.iconButton}
                    onClick={() => toggleInstrumentPicker(clip.id)}
                    type="button"
                  >
                    <Icon name="add" />
                  </button>
                  <button
                    aria-label={`Delete ${clip.name}`}
                    className={styles.iconButton}
                    onClick={() => onClipDelete(clip.id)}
                    type="button"
                  >
                    <Icon name="remove" />
                  </button>
                </div>
              </div>

              {isClipExpanded && addingInstrumentClipId === clip.id ? (
                <div
                  className={styles.instrumentPicker}
                  role="listbox"
                  aria-label={`Available instruments for ${clip.name}`}
                >
                  {availableInstruments.length > 0 ? (
                    availableInstruments.map((instrument) => (
                      <button
                        className={styles.instrumentPickerOption}
                        key={instrument.id}
                        onClick={() => {
                          onInstrumentAdd(clip.id, instrument.id);
                          setAddingInstrumentClipId(null);
                        }}
                        type="button"
                      >
                        <Icon name="music_note_2" />
                        <span>{instrument.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className={styles.emptyPicker}>All instruments added</p>
                  )}
                </div>
              ) : null}

              {isClipExpanded ? (
                <div className={styles.instrumentList}>
                  <button
                    aria-pressed={isClipSelected && selectedInstrumentId === "drums"}
                    className={`${styles.instrumentButton} ${
                      isClipSelected && selectedInstrumentId === "drums"
                        ? styles.instrumentButtonActive
                        : ""
                    }`}
                    onClick={() => onInstrumentSelect(clip.id, "drums")}
                    type="button"
                  >
                    <Icon name="grid_view" />
                    <span>Drums</span>
                  </button>

                  {clip.pitchedInstrumentIds.map((instrumentId) => {
                    const instrument = PITCHED_INSTRUMENTS.find(
                      (candidate) => candidate.id === instrumentId,
                    );
                    const label = instrument?.name ?? instrumentId;
                    const isInstrumentSelected =
                      isClipSelected && selectedInstrumentId === instrumentId;

                    return (
                      <div
                        className={`${styles.instrumentRow} ${
                          isInstrumentSelected ? styles.instrumentRowActive : ""
                        }`}
                        key={instrumentId}
                      >
                        <button
                          aria-pressed={isInstrumentSelected}
                          className={`${styles.instrumentButton} ${
                            isInstrumentSelected
                              ? styles.instrumentButtonActive
                              : ""
                          }`}
                          onClick={() => onInstrumentSelect(clip.id, instrumentId)}
                          type="button"
                        >
                          <Icon name="music_note_2" />
                          <span>{label}</span>
                        </button>
                        <button
                          aria-label={`Remove ${label} from ${clip.name}`}
                          className={styles.instrumentRemoveButton}
                          onClick={() => onInstrumentRemove(clip.id, instrumentId)}
                          type="button"
                        >
                          <Icon name="remove" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.footerButton} type="button">
          <Icon name="settings" />
          <span>Settings</span>
        </button>
        <button className={styles.footerButton} type="button">
          <Icon name="ios_share" />
          <span>Export</span>
        </button>
      </div>
    </aside>
  );
}
