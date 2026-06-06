import { useRef, useState } from "react";

import {
  BUNDLED_DRUM_SAMPLES,
  createAudioEngine,
  type BundledSampleMeta,
  type SampleLoopEvent,
} from "../audio";
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
  moveDrumLane,
  toggleDrumStep,
  updateDrumLaneSample,
  type DrumEvent,
  type HybridClip,
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
  const selectedClipRef = useRef(selectedClip);
  const [audioError, setAudioError] = useState<string | null>(null);

  function commitSelectedClip(nextClip: HybridClip) {
    selectedClipRef.current = nextClip;
    setSelectedClip(nextClip);

    if (transportState === "playing") {
      void updatePlayingDrumEvents(nextClip.drumEvents);
    }
  }

  function handleDrumStepToggle(laneId: DrumLaneId, stepIndex: number) {
    commitSelectedClip(
      toggleDrumStep({
        clip: selectedClipRef.current,
        laneId,
        stepIndex,
      }),
    );
  }

  function handleLaneSampleChange(
    laneId: DrumLaneId,
    sample: BundledSampleMeta,
  ) {
    commitSelectedClip(
      updateDrumLaneSample({
        clip: selectedClipRef.current,
        label: sample.name,
        laneId,
        sampleId: sample.id,
      }),
    );
  }

  function handleLaneMove(laneId: DrumLaneId, targetIndex: number) {
    commitSelectedClip(
      moveDrumLane({
        clip: selectedClipRef.current,
        laneId,
        targetIndex,
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
        events: drumEventsToSampleLoopEvents(selectedClipRef.current.drumEvents),
        tempoBpm: bpm,
      });
    } catch (error) {
      setTransportState("stopped");
      setAudioError(
        error instanceof Error ? error.message : "Audio playback failed.",
      );
    }
  }

  async function updatePlayingDrumEvents(drumEvents: readonly DrumEvent[]) {
    setAudioError(null);

    try {
      await audioEngine.updateSampleLoopEvents(
        drumEventsToSampleLoopEvents(drumEvents),
      );
    } catch (error) {
      setAudioError(
        error instanceof Error ? error.message : "Audio pattern update failed.",
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
              drumLanes={selectedClip.drumLanes}
              onLaneMove={handleLaneMove}
              onLaneSampleChange={handleLaneSampleChange}
              onStepToggle={handleDrumStepToggle}
              samples={BUNDLED_DRUM_SAMPLES}
            />
            <PianoRoll instrumentName={instrumentLabels[selectedInstrumentId]} />
          </div>
        </main>
      </div>
    </div>
  );
}
