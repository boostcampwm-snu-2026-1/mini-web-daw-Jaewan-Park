import { Panel } from "../../components";
import { PianoKeyboard, type PianoKeyRow } from "./PianoKeyboard";
import { VelocityEditor } from "./VelocityEditor";
import styles from "./PianoRoll.module.css";

interface PianoRollProps {
  instrumentName: string;
}

interface DemoNote {
  id: string;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
  velocity: number;
}

const pianoRows: PianoKeyRow[] = [
  { id: "c4", label: "C4", keyType: "white" },
  { id: "b3", label: "B3", keyType: "white" },
  { id: "a-sharp-3", label: "A#3", keyType: "black" },
  { id: "a3", label: "A3", keyType: "white" },
  { id: "g-sharp-3", label: "G#3", keyType: "black" },
  { id: "g3", label: "G3", keyType: "white" },
  { id: "f-sharp-3", label: "F#3", keyType: "black" },
  { id: "f3", label: "F3", keyType: "white" },
];

const demoNotes: DemoNote[] = [
  {
    id: "n1",
    label: "C4",
    top: "calc(0 * var(--piano-row-height) + 4px)",
    left: "40px",
    width: "112px",
    height: "24px",
    velocity: 72,
  },
  {
    id: "n2",
    label: "A3",
    top: "calc(3 * var(--piano-row-height) + 4px)",
    left: "152px",
    width: "88px",
    height: "24px",
    velocity: 44,
  },
  {
    id: "n3",
    label: "G3",
    top: "calc(5 * var(--piano-row-height) + 4px)",
    left: "248px",
    width: "120px",
    height: "24px",
    velocity: 62,
  },
  {
    id: "n4",
    label: "A#3",
    top: "calc(2 * var(--piano-row-height) + 4px)",
    left: "408px",
    width: "88px",
    height: "24px",
    velocity: 84,
  },
  {
    id: "n5",
    label: "C4",
    top: "calc(0 * var(--piano-row-height) + 4px)",
    left: "500px",
    width: "112px",
    height: "24px",
    velocity: 68,
  },
];

export function PianoRoll({ instrumentName }: PianoRollProps) {
  return (
    <Panel
      actions={
        <div className={styles.rollActions}>
          <span>Snap: 1/16</span>
          <span>Tool: Draw</span>
        </div>
      }
      className={styles.pianoRollPanel}
      eyebrow="PIANO ROLL"
      title={instrumentName}
    >
      <div className={styles.rollShell}>
        <div className={styles.editorBody}>
          <PianoKeyboard rows={pianoRows} />

          <div className={styles.gridViewport}>
            <div className={styles.beatHeader} aria-hidden="true">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>

            <div className={styles.noteGrid} aria-label="Piano roll note grid">
              {demoNotes.map((note) => (
                <button
                  aria-label={`${note.label} demo note`}
                  className={styles.note}
                  key={note.id}
                  style={{
                    height: note.height,
                    left: note.left,
                    top: note.top,
                    width: note.width,
                  }}
                  type="button"
                >
                  {note.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <VelocityEditor notes={demoNotes} />
      </div>
    </Panel>
  );
}
