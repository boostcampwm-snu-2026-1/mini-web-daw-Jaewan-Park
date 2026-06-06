import styles from "./PianoRoll.module.css";

export interface PianoKeyRow {
  id: string;
  label: string;
  keyType: "white" | "black";
}

interface PianoKeyboardProps {
  rows: PianoKeyRow[];
  scrollTop?: number;
}

export function PianoKeyboard({ rows, scrollTop = 0 }: PianoKeyboardProps) {
  return (
    <div className={styles.keyboard} aria-label="Piano keyboard">
      <div className={styles.keyboardHeader} aria-hidden="true" />
      <div
        className={styles.keyboardRows}
        style={{ transform: `translateY(-${scrollTop}px)` }}
      >
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
    </div>
  );
}
