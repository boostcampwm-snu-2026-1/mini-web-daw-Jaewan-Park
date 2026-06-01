import { Panel } from "../../components";
import { PianoKeyboard } from "./PianoKeyboard";
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
}

const demoNotes: DemoNote[] = [
  { id: "n1", label: "C4", top: "8px", left: "40px", width: "112px", height: "22px" },
  { id: "n2", label: "E3", top: "136px", left: "152px", width: "88px", height: "22px" },
  { id: "n3", label: "G3", top: "72px", left: "248px", width: "120px", height: "22px" },
  { id: "n4", label: "A3", top: "40px", left: "408px", width: "88px", height: "22px" },
  { id: "n5", label: "C4", top: "8px", left: "520px", width: "144px", height: "22px" },
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
      eyebrow="Melodic editor"
      title={`Piano Roll - ${instrumentName}`}
    >
      <div className={styles.rollShell}>
        <div className={styles.editorBody}>
          <PianoKeyboard />

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

        <VelocityEditor />
      </div>
    </Panel>
  );
}
