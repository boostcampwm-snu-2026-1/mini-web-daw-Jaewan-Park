import { useState } from "react";

import { createAudioEngine, type SampleLoopEvent } from "../audio";
import {
  DrumSequencer,
  PianoRoll,
  ProjectSidebar,
  TransportBar,
  type InstrumentId,
  type TransportMode,
  type TransportState,
} from "../features";
import {
  createEmptyHybridClip,
  toggleDrumStep,
  type DrumEvent,
  type DrumLaneId,
} from "../model";
import styles from "./App.module.css";

const audioEngine = createAudioEngine();

const instrumentLabels: Record<InstrumentId, string> = {
  drums: "Drums",
  leadSynth: "Lead Synth",
  subBass: "Sub Bass",
};

function drumEventsToSampleLoopEvents(
  drumEvents: readonly DrumEvent[],
): SampleLoopEvent[] {
  return drumEvents.map((event) => ({
    gain: event.velocity,
    id: event.id,
    sampleId: event.sampleId,
    startTick: event.startTick,
  }));
}

export function App() {
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [transportMode, setTransportMode] = useState<TransportMode>("pattern");
  const [bpm, setBpm] = useState(124);
  const [selectedInstrumentId, setSelectedInstrumentId] =
    useState<InstrumentId>("leadSynth");
  const [selectedClip, setSelectedClip] = useState(() => createEmptyHybridClip());
  const [audioError, setAudioError] = useState<string | null>(null);

  function handleDrumStepToggle(laneId: DrumLaneId, stepIndex: number) {
    setSelectedClip((currentClip) =>
      toggleDrumStep({
        clip: currentClip,
        laneId,
        stepIndex,
      }),
    );
  }

  async function handleTransportStateChange(nextTransportState: TransportState) {
    setAudioError(null);

    if (nextTransportState === "stopped") {
      audioEngine.stopLoop();
      setTransportState("stopped");
      return;
    }

    setTransportState("playing");

    try {
      await audioEngine.startSampleLoop({
        events: drumEventsToSampleLoopEvents(selectedClip.drumEvents),
        tempoBpm: bpm,
      });
    } catch (error) {
      setTransportState("stopped");
      setAudioError(
        error instanceof Error ? error.message : "Audio playback failed.",
      );
    }
  }

  return (
    <div className={styles.appShell}>
      <TransportBar
        bpm={bpm}
        mode={transportMode}
        onBpmChange={setBpm}
        onModeChange={setTransportMode}
        onTransportStateChange={handleTransportStateChange}
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
              <h1 className={styles.title}>{selectedClip.name}</h1>
            </div>
            <div className={styles.clipMeta}>
              <span>1 bar</span>
              <span>4/4</span>
              <span>PPQ 480</span>
              <span>{selectedClip.drumEvents.length} drum events</span>
              {audioError ? (
                <span className={styles.errorMeta}>{audioError}</span>
              ) : null}
            </div>
          </header>

          <div className={styles.editorStack}>
            <DrumSequencer
              drumEvents={selectedClip.drumEvents}
              onStepToggle={handleDrumStepToggle}
            />
            <PianoRoll instrumentName={instrumentLabels[selectedInstrumentId]} />
          </div>
        </main>
      </div>
    </div>
  );
}
