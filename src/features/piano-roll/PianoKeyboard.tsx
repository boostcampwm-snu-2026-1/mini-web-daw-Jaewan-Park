import styles from "./PianoRoll.module.css";

const keyboardRows = [
  { id: "c4", label: "C4", blackKeyLabel: "C#4" },
  { id: "b3", label: "B3" },
  { id: "a3", label: "A3", blackKeyLabel: "A#3" },
  { id: "g3", label: "G3", blackKeyLabel: "G#3" },
  { id: "f3", label: "F3", blackKeyLabel: "F#3" },
  { id: "e3", label: "E3" },
  { id: "d3", label: "D3", blackKeyLabel: "D#3" },
  { id: "c3", label: "C3", blackKeyLabel: "C#3" },
];

export function PianoKeyboard() {
  return (
    <div className={styles.keyboard} aria-label="Piano keyboard">
      {keyboardRows.map((key) => (
        <div className={styles.keyRow} key={key.id}>
          <div className={styles.whiteKey}>{key.label}</div>
          {key.blackKeyLabel ? (
            <div className={styles.blackKey}>{key.blackKeyLabel}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
