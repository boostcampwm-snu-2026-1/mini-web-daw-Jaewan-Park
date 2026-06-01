import styles from "./PianoRoll.module.css";

export interface PianoKeyRow {
  id: string;
  label: string;
  keyType: "white" | "black";
}

interface PianoKeyboardProps {
  rows: PianoKeyRow[];
}

export function PianoKeyboard({ rows }: PianoKeyboardProps) {
  return (
    <div className={styles.keyboard} aria-label="Piano keyboard">
      <div className={styles.keyboardHeader} aria-hidden="true" />
      {rows.map((key) => (
        <div
          className={`${styles.keyCell} ${
            key.keyType === "black" ? styles.keyCellBlack : styles.keyCellWhite
          }`}
          key={key.id}
        >
          {key.label}
        </div>
      ))}
    </div>
  );
}
