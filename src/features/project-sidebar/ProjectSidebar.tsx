import { Icon } from "../../components";
import styles from "./ProjectSidebar.module.css";

export type InstrumentId = "drums" | "leadSynth" | "subBass";

const instruments = [
  { id: "drums", label: "Drums", icon: "avg_pace" },
  { id: "leadSynth", label: "Lead Synth", icon: "graphic_eq" },
  { id: "subBass", label: "Sub Bass", icon: "waves" },
] as const;

interface ProjectSidebarProps {
  selectedInstrumentId: InstrumentId;
  onInstrumentSelect: (instrumentId: InstrumentId) => void;
}

export function ProjectSidebar({
  selectedInstrumentId,
  onInstrumentSelect,
}: ProjectSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Project sidebar">
      <div className={styles.projectHeader}>
        <p className={styles.sectionLabel}>Project</p>
        <h2 className={styles.projectName}>Project 1</h2>
      </div>

      <nav className={styles.clipBrowser} aria-label="Clips and instruments">
        <p className={styles.sectionLabel}>Clips</p>
        <div className={styles.clipGroup}>
          <button className={styles.clipButtonExpanded} type="button">
            <Icon name="expand_more" />
            <span>CLIP 1</span>
          </button>
          <div className={styles.instrumentList}>
            {instruments.map((instrument) => (
              <button
                aria-pressed={selectedInstrumentId === instrument.id}
                className={`${styles.instrumentButton} ${
                  selectedInstrumentId === instrument.id
                    ? styles.instrumentButtonActive
                    : ""
                }`}
                key={instrument.id}
                onClick={() => onInstrumentSelect(instrument.id)}
                type="button"
              >
                <Icon name={instrument.icon} />
                <span>{instrument.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.clipGroup}>
          <button className={styles.clipButton} type="button">
            <Icon name="chevron_right" />
            <span>CLIP 2</span>
          </button>
        </div>
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
