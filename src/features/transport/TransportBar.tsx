import { Icon } from "../../components";
import styles from "./TransportBar.module.css";

export type TransportState = "playing" | "stopped";
export type TransportMode = "pattern" | "song";

interface TransportBarProps {
  bpm: number;
  mode: TransportMode;
  transportState: TransportState;
  onBpmChange: (bpm: number) => void;
  onModeChange: (mode: TransportMode) => void;
  onTransportStateChange: (state: TransportState) => void;
}

export function TransportBar({
  bpm,
  mode,
  transportState,
  onBpmChange,
  onModeChange,
  onTransportStateChange,
}: TransportBarProps) {
  const isPlaying = transportState === "playing";

  return (
    <header className={styles.transportBar}>
      <div className={styles.brandGroup}>
        <div className={styles.logoMark}>m</div>
        <div>
          <p className={styles.appLabel}>mini DAW</p>
          <p className={styles.statusText}>{isPlaying ? "Playing" : "Stopped"}</p>
        </div>
      </div>

      <div className={styles.transportGroup} aria-label="Transport controls">
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`${styles.iconButton} ${isPlaying ? styles.iconButtonActive : ""}`}
          onClick={() => onTransportStateChange(isPlaying ? "stopped" : "playing")}
          type="button"
        >
          <Icon name={isPlaying ? "pause" : "play_arrow"} />
        </button>
        <button
          aria-label="Stop"
          className={`${styles.iconButton} ${!isPlaying ? styles.iconButtonActive : ""}`}
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
          max="180"
          min="60"
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
        <span className={styles.projectName}>Project 1</span>
        <Icon name="tune" />
      </div>
    </header>
  );
}
