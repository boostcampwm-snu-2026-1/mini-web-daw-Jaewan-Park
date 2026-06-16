import { useState } from "react";

import { BUNDLED_DRUM_SAMPLES, createAudioEngine } from "../../audio";
import type { AudioEngineSnapshot, SampleId } from "../../audio";
import styles from "./SamplePlaybackPanel.module.css";

const audioEngine = createAudioEngine();

type PlaybackStatus = "idle" | "loading" | "ready" | "playing" | "error";

export function SamplePlaybackPanel() {
  const [snapshot, setSnapshot] = useState<AudioEngineSnapshot>(
    audioEngine.getSnapshot(),
  );
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [message, setMessage] = useState(
    "Load samples, then trigger one-shots from the audio engine.",
  );
  const [activeSampleId, setActiveSampleId] = useState<SampleId | null>(null);

  const isLoading = status === "loading";

  async function handleLoadSamples() {
    setStatus("loading");
    setMessage("Creating AudioContext and decoding bundled drum samples.");

    try {
      const nextSnapshot = await audioEngine.loadAllSamples();
      setSnapshot(nextSnapshot);
      setStatus("ready");
      setMessage("Samples decoded into the audio engine runtime cache.");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function handlePlaySample(sampleId: SampleId, sampleName: string) {
    setStatus("playing");
    setActiveSampleId(sampleId);
    setMessage(`Scheduling ${sampleName} one-shot playback.`);

    try {
      await audioEngine.playSample(sampleId);
      setSnapshot(audioEngine.getSnapshot());
      setStatus("ready");
      setMessage(`${sampleName} was scheduled with a fresh source node.`);
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    } finally {
      setActiveSampleId(null);
    }
  }

  return (
    <article className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.panelLabel}>Audio engine</p>
          <h2 className={styles.panelTitle}>Sample playback</h2>
        </div>
        <button
          className={styles.loadButton}
          disabled={isLoading}
          onClick={handleLoadSamples}
          type="button"
        >
          {isLoading ? "Loading" : "Load samples"}
        </button>
      </div>

      <dl className={styles.statusGrid}>
        <div>
          <dt>AudioContext</dt>
          <dd>{snapshot.contextState}</dd>
        </div>
        <div>
          <dt>Decoded samples</dt>
          <dd>
            {snapshot.loadedSampleIds.length} / {BUNDLED_DRUM_SAMPLES.length}
          </dd>
        </div>
      </dl>

      <p className={status === "error" ? styles.errorMessage : styles.message}>
        {message}
      </p>

      <div className={styles.sampleGrid}>
        {BUNDLED_DRUM_SAMPLES.map((sample) => (
          <button
            className={styles.sampleButton}
            disabled={isLoading}
            key={sample.id}
            onClick={() => void handlePlaySample(sample.id, sample.name)}
            type="button"
          >
            <span className={styles.sampleName}>{sample.name}</span>
            <span className={styles.sampleState}>
              {activeSampleId === sample.id ? "Scheduling" : "Trigger"}
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Audio playback failed.";
}
