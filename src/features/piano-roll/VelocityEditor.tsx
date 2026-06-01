import styles from "./PianoRoll.module.css";

export interface VelocityNote {
  id: string;
  label: string;
  left: string;
  width: string;
  velocity: number;
}

interface VelocityEditorProps {
  notes: VelocityNote[];
}

export function VelocityEditor({ notes }: VelocityEditorProps) {
  return (
    <section className={styles.velocityEditor} aria-label="Velocity editor">
      <div className={styles.velocityLabel}>Velocity</div>
      <div className={styles.velocityGrid}>
        {notes.map((note) => (
          <div
            aria-label={`${note.label} velocity ${note.velocity}`}
            className={styles.velocityBar}
            key={note.id}
            role="img"
            style={{
              height: `${note.velocity}%`,
              left: note.left,
              width: note.width,
            }}
          />
        ))}
      </div>
    </section>
  );
}
