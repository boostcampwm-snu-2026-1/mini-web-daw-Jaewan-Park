import { useState } from "react";

import {
  DrumSequencer,
  PianoRoll,
  ProjectSidebar,
  TransportBar,
  type InstrumentId,
  type TransportMode,
  type TransportState,
} from "../features";
import styles from "./App.module.css";

const instrumentLabels: Record<InstrumentId, string> = {
  drums: "Drums",
  leadSynth: "Lead Synth",
  subBass: "Sub Bass",
};

export function App() {
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [transportMode, setTransportMode] = useState<TransportMode>("pattern");
  const [bpm, setBpm] = useState(124);
  const [selectedInstrumentId, setSelectedInstrumentId] =
    useState<InstrumentId>("leadSynth");

  return (
    <div className={styles.appShell}>
      <TransportBar
        bpm={bpm}
        mode={transportMode}
        onBpmChange={setBpm}
        onModeChange={setTransportMode}
        onTransportStateChange={setTransportState}
        transportState={transportState}
      />

      <div className={styles.mainLayout}>
        <ProjectSidebar
          onInstrumentSelect={setSelectedInstrumentId}
          selectedInstrumentId={selectedInstrumentId}
        />

        <main className={styles.workspace} aria-label="Hybrid clip editor">
          <header className={styles.workspaceHeader}>
            <div>
              <p className={styles.eyebrow}>M1 Hybrid Clip Editor</p>
              <h1 className={styles.title}>Clip 1</h1>
            </div>
            <div className={styles.clipMeta}>
              <span>1 bar</span>
              <span>4/4</span>
              <span>PPQ 480</span>
            </div>
          </header>

          <div className={styles.editorStack}>
            <DrumSequencer />
            <PianoRoll instrumentName={instrumentLabels[selectedInstrumentId]} />
          </div>
        </main>
      </div>
    </div>
  );
}
