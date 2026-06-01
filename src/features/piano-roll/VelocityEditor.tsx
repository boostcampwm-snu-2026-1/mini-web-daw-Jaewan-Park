import styles from "./PianoRoll.module.css";

const velocityBars = [
  { id: "v1", left: "4%", height: "72%" },
  { id: "v2", left: "10%", height: "42%" },
  { id: "v3", left: "16%", height: "56%" },
  { id: "v4", left: "28%", height: "80%" },
  { id: "v5", left: "34%", height: "64%" },
  { id: "v6", left: "46%", height: "48%" },
  { id: "v7", left: "52%", height: "74%" },
  { id: "v8", left: "68%", height: "52%" },
  { id: "v9", left: "74%", height: "68%" },
  { id: "v10", left: "86%", height: "40%" },
];

export function VelocityEditor() {
  return (
    <section className={styles.velocityEditor} aria-label="Velocity editor">
      <div className={styles.velocityLabel}>Velocity</div>
      <div className={styles.velocityGrid}>
        {velocityBars.map((bar) => (
          <span
            aria-hidden="true"
            className={styles.velocityBar}
            key={bar.id}
            style={{ height: bar.height, left: bar.left }}
          />
        ))}
      </div>
    </section>
  );
}
