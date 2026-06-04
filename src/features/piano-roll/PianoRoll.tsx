import { Panel } from "../../components";
import { PianoKeyboard, type PianoKeyRow } from "./PianoKeyboard";
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

const pianoRows: PianoKeyRow[] = [
  { id: "c4", label: "C4", keyType: "white" },
  { id: "b3", label: "B3", keyType: "white" },
  { id: "a-sharp-3", label: "A#3", keyType: "black" },
  { id: "a3", label: "A3", keyType: "white" },
  { id: "g-sharp-3", label: "G#3", keyType: "black" },
  { id: "g3", label: "G3", keyType: "white" },
  { id: "f-sharp-3", label: "F#3", keyType: "black" },
  { id: "f3", label: "F3", keyType: "white" },
  { id: "e3", label: "E3", keyType: "white" },
  { id: "d-sharp-3", label: "D#3", keyType: "black" },
  { id: "d3", label: "D3", keyType: "white" },
  { id: "c-sharp-3", label: "C#3", keyType: "black" },
  { id: "c3", label: "C3", keyType: "white" },
  { id: "b2", label: "B2", keyType: "white" },
  { id: "a-sharp-2", label: "A#2", keyType: "black" },
  { id: "a2", label: "A2", keyType: "white" },
  { id: "g-sharp-2", label: "G#2", keyType: "black" },
  { id: "g2", label: "G2", keyType: "white" },
  { id: "f-sharp-2", label: "F#2", keyType: "black" },
  { id: "f2", label: "F2", keyType: "white" },
  { id: "e2", label: "E2", keyType: "white" },
  { id: "d-sharp-2", label: "D#2", keyType: "black" },
  { id: "d2", label: "D2", keyType: "white" },
  { id: "c-sharp-2", label: "C#2", keyType: "black" },
  { id: "c2", label: "C2", keyType: "white" },
];

const demoNotes: DemoNote[] = [];

const beatMarkers = [
  { id: "beat-1", label: "1", className: styles.beatMarkerOne },
  { id: "beat-2", label: "2", className: styles.beatMarkerTwo },
  { id: "beat-3", label: "3", className: styles.beatMarkerThree },
  { id: "beat-4", label: "4", className: styles.beatMarkerFour },
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
              {beatMarkers.map((marker) => (
                <span
                  className={`${styles.beatMarker} ${marker.className}`}
                  key={marker.id}
                >
                  {marker.label}
                </span>
              ))}
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
      </div>
    </Panel>
  );
}
