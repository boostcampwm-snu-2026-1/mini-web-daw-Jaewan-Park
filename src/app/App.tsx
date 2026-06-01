import { SamplePlaybackPanel } from "../features/sample-playback";
import styles from "./App.module.css";

export function App() {
  return (
    <main className={styles.root}>
      <section className={styles.transportBar} aria-label="Transport">
        <div>
          <p className={styles.eyebrow}>Mini Web DAW</p>
          <h1 className={styles.title}>Audio sample playback</h1>
        </div>
        <div className={styles.transportControls}>
          <button className={styles.controlButton} type="button" disabled>
            Play
          </button>
          <button className={styles.controlButton} type="button" disabled>
            Stop
          </button>
        </div>
      </section>

      <section className={styles.workspace} aria-label="Clip editor scaffold">
        <SamplePlaybackPanel />

        <article className={styles.panel}>
          <p className={styles.panelLabel}>Selected clip editor</p>
          <h2 className={styles.panelTitle}>Hybrid clip editor pending</h2>
          <p className={styles.panelText}>
            The scaffold is ready for the first 1-bar clip editor milestone.
          </p>
        </article>

        <article className={styles.panel}>
          <p className={styles.panelLabel}>Drum step sequencer</p>
          <h2 className={styles.panelTitle}>16-step grid pending</h2>
          <div className={styles.stepPreview} aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => (
              <span className={styles.stepCell} key={index} />
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <p className={styles.panelLabel}>Piano roll</p>
          <h2 className={styles.panelTitle}>Note grid pending</h2>
          <div className={styles.rollPreview} aria-hidden="true" />
        </article>
      </section>
    </main>
  );
}
