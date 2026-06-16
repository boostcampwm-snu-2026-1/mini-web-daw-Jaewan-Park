import { useState } from "react";

import { Icon } from "../../components";
import { MAX_TEMPO_BPM, MIN_TEMPO_BPM } from "../../utils";
import styles from "./TransportBar.module.css";

export type TransportState = "paused" | "playing" | "stopped";
export type TransportMode = "pattern" | "song";

interface ProjectMenuProject {
  id: string;
  name: string;
  updatedAt: number;
}

interface TransportBarProps {
  activeProjectId: string;
  bpm: number;
  isProjectOperationPending?: boolean;
  mode: TransportMode;
  persistenceStatusLabel?: string;
  persistenceStatusTitle?: string;
  persistenceStatusTone?: "default" | "error";
  projectName: string;
  projects: readonly ProjectMenuProject[];
  transportState: TransportState;
  onBpmChange: (bpm: number) => void;
  onModeChange: (mode: TransportMode) => void;
  onProjectCreate: () => void;
  onProjectDelete: () => void;
  onProjectRename: () => void;
  onProjectSelect: (projectId: string) => void;
  onTransportStateChange: (state: TransportState) => void;
}

export function TransportBar({
  activeProjectId,
  bpm,
  isProjectOperationPending = false,
  mode,
  persistenceStatusLabel = "Saved",
  persistenceStatusTitle,
  persistenceStatusTone = "default",
  projectName,
  projects,
  transportState,
  onBpmChange,
  onModeChange,
  onProjectCreate,
  onProjectDelete,
  onProjectRename,
  onProjectSelect,
  onTransportStateChange,
}: TransportBarProps) {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const isPlaying = transportState === "playing";
  const statusText =
    transportState === "playing"
      ? "Playing"
      : transportState === "paused"
        ? "Paused"
        : "Stopped";

  return (
    <header className={styles.transportBar}>
      <div className={styles.brandGroup}>
        <div className={styles.logoMark}>m</div>
        <div>
          <p className={styles.appLabel}>mini DAW</p>
          <p className={styles.statusText}>{statusText}</p>
        </div>
      </div>

      <div className={styles.transportGroup} aria-label="Transport controls">
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`${styles.iconButton} ${isPlaying ? styles.iconButtonActive : ""}`}
          onClick={() => onTransportStateChange(isPlaying ? "paused" : "playing")}
          type="button"
        >
          <Icon name={isPlaying ? "pause" : "play_arrow"} />
        </button>
        <button
          aria-label="Stop"
          className={`${styles.iconButton} ${
            transportState === "stopped" ? styles.iconButtonActive : ""
          }`}
          onClick={() => onTransportStateChange("stopped")}
          type="button"
        >
          <Icon name="stop" />
        </button>
        <button
          aria-label="Record"
          className={`${styles.iconButton} ${styles.recordButton}`}
          type="button"
        >
          <Icon name="radio_button_checked" />
        </button>
      </div>

      <div className={styles.bpmControl}>
        <span className={styles.bpmValue}>{bpm}</span>
        <span className={styles.bpmLabel}>BPM</span>
        <input
          aria-label="BPM"
          className={styles.bpmSlider}
          max={MAX_TEMPO_BPM}
          min={MIN_TEMPO_BPM}
          onChange={(event) => onBpmChange(Number(event.target.value))}
          type="range"
          value={bpm}
        />
      </div>

      <div className={styles.modeToggle} aria-label="Playback mode">
        <button
          aria-pressed={mode === "pattern"}
          className={`${styles.modeButton} ${mode === "pattern" ? styles.modeButtonActive : ""}`}
          onClick={() => onModeChange("pattern")}
          type="button"
        >
          PAT
        </button>
        <button
          aria-pressed={mode === "song"}
          className={`${styles.modeButton} ${mode === "song" ? styles.modeButtonActive : ""}`}
          onClick={() => onModeChange("song")}
          type="button"
        >
          SONG
        </button>
      </div>

      <div className={styles.rightStatus}>
        <span
          className={`${styles.saveStatus} ${
            persistenceStatusTone === "error" ? styles.saveStatusError : ""
          }`}
          title={persistenceStatusTitle}
        >
          {persistenceStatusLabel}
        </span>
        <div className={styles.projectMenuRoot}>
          <button
            aria-expanded={isProjectMenuOpen}
            aria-haspopup="menu"
            className={styles.projectButton}
            disabled={isProjectOperationPending}
            onClick={() => setIsProjectMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span className={styles.projectName}>
              {projectName || "Untitled Project"}
            </span>
            <Icon name="expand_more" />
          </button>

          {isProjectMenuOpen ? (
            <div className={styles.projectMenu} role="menu">
              <p className={styles.projectMenuLabel}>Local Projects</p>
              <div className={styles.projectMenuList}>
                {projects.map((project) => (
                  <button
                    aria-current={
                      project.id === activeProjectId ? "page" : undefined
                    }
                    className={`${styles.projectMenuItem} ${
                      project.id === activeProjectId
                        ? styles.projectMenuItemActive
                        : ""
                    }`}
                    disabled={isProjectOperationPending}
                    key={project.id}
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      onProjectSelect(project.id);
                    }}
                    role="menuitem"
                    title={`Last saved ${new Date(project.updatedAt).toLocaleString()}`}
                    type="button"
                  >
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>

              <div className={styles.projectMenuActions}>
                <button
                  className={styles.projectMenuAction}
                  disabled={isProjectOperationPending}
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onProjectCreate();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Icon name="add" />
                  <span>New Project</span>
                </button>
                <button
                  className={styles.projectMenuAction}
                  disabled={isProjectOperationPending || !activeProjectId}
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onProjectRename();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Icon name="edit" />
                  <span>Rename</span>
                </button>
                <button
                  className={`${styles.projectMenuAction} ${styles.projectMenuDangerAction}`}
                  disabled={isProjectOperationPending || !activeProjectId}
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    onProjectDelete();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Icon name="delete" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
