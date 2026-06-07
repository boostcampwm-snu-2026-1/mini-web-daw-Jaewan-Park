import { useEffect, useRef, useState } from "react";

import {
  BUNDLED_DRUM_SAMPLES,
  createAudioEngine,
  type BundledSampleMeta,
  type NoteLoopEvent,
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
  addNoteEvent,
  createEmptyHybridClip,
  deleteNoteEvent,
  getPitchedInstrument,
  moveDrumLane,
  moveNoteEvent,
  toggleDrumStep,
  updateDrumLaneSample,
  type DrumEvent,
  type DrumLaneId,
  type HybridClip,
  type NoteEvent,
  type PitchedInstrumentId,
} from "../model";
import { DEFAULT_TEMPO_BPM, clampTempoBpm, type Tick } from "../utils";
import styles from "./App.module.css";

const audioEngine = createAudioEngine();

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

function noteEventsToNoteLoopEvents(
  noteEvents: readonly NoteEvent[],
): NoteLoopEvent[] {
  return noteEvents.map((event) => ({
    durationTicks: event.durationTicks,
    gain: event.velocity,
    id: event.id,
    instrumentId: event.instrumentId,
    midiNote: event.midiNote,
    startTick: event.startTick,
  }));
}

export function App() {
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [transportMode, setTransportMode] = useState<TransportMode>("pattern");
  const [bpm, setBpm] = useState(DEFAULT_TEMPO_BPM);
  const bpmRef = useRef(DEFAULT_TEMPO_BPM);
  const [selectedInstrumentId, setSelectedInstrumentId] =
    useState<InstrumentId>("iowa-piano");
  const [selectedPitchedInstrumentId, setSelectedPitchedInstrumentId] =
    useState<PitchedInstrumentId>("iowa-piano");
  const [selectedClip, setSelectedClip] = useState(() => createEmptyHybridClip());
  const selectedClipRef = useRef(selectedClip);
  const [playheadTick, setPlayheadTick] = useState<Tick>(0);
  const playheadTickRef = useRef<Tick>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const shouldShowPlayhead = transportState !== "stopped";
  const selectedPitchedInstrument = getPitchedInstrument(
    selectedPitchedInstrumentId,
  );
  const selectedPitchedNoteEvents = selectedClip.noteEvents.filter(
    (event) => event.instrumentId === selectedPitchedInstrumentId,
  );

  useEffect(() => {
    if (transportState !== "playing") {
      return;
    }

    let animationFrameId = 0;

    function updatePlayhead() {
      const currentTick = audioEngine.getTransportSnapshot().currentTick;

      playheadTickRef.current = currentTick;
      setPlayheadTick(currentTick);
      animationFrameId = window.requestAnimationFrame(updatePlayhead);
    }

    animationFrameId = window.requestAnimationFrame(updatePlayhead);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [transportState]);

  function commitSelectedClip(nextClip: HybridClip) {
    selectedClipRef.current = nextClip;
    setSelectedClip(nextClip);

    if (transportState === "playing") {
      void updatePlayingClipEvents(nextClip);
    }
  }

  function commitPlayheadTick(nextTick: Tick) {
    playheadTickRef.current = nextTick;
    setPlayheadTick(nextTick);
  }

  function commitBpm(nextBpm: number) {
    const normalizedBpm = clampTempoBpm(nextBpm);
    const snapshot = audioEngine.setTempoBpm(normalizedBpm);

    bpmRef.current = snapshot.tempoBpm;
    setBpm(snapshot.tempoBpm);
    commitPlayheadTick(snapshot.currentTick);
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

  function handleNoteCreate({
    durationTicks,
    midiNote,
    startTick,
  }: {
    durationTicks: Tick;
    midiNote: number;
    startTick: Tick;
  }) {
    commitSelectedClip(
      addNoteEvent({
        clip: selectedClipRef.current,
        durationTicks,
        instrumentId: selectedPitchedInstrumentId,
        midiNote,
        startTick,
      }),
    );
  }

  function handleNoteDelete(noteId: string) {
    commitSelectedClip(
      deleteNoteEvent({
        clip: selectedClipRef.current,
        noteId,
      }),
    );
  }

  function handleNoteMove({
    midiNote,
    noteId,
    startTick,
  }: {
    midiNote: number;
    noteId: string;
    startTick: Tick;
  }) {
    commitSelectedClip(
      moveNoteEvent({
        clip: selectedClipRef.current,
        midiNote,
        noteId,
        startTick,
      }),
    );
  }

  function handleInstrumentSelect(instrumentId: InstrumentId) {
    setSelectedInstrumentId(instrumentId);

    if (instrumentId !== "drums") {
      setSelectedPitchedInstrumentId(instrumentId);
    }
  }

  async function handleTransportStateChange(nextTransportState: TransportState) {
    setAudioError(null);

    if (nextTransportState === "stopped") {
      const snapshot = audioEngine.stopLoop();
      setTransportState(snapshot.status);
      commitPlayheadTick(snapshot.currentTick);
      return;
    }

    if (nextTransportState === "paused") {
      const snapshot = audioEngine.pauseLoop();
      setTransportState(snapshot.status);
      commitPlayheadTick(snapshot.currentTick);
      return;
    }

    const startTick = transportState === "paused" ? playheadTickRef.current : 0;

    setTransportState("playing");

    try {
      const snapshot = await audioEngine.startClipLoop({
        noteEvents: noteEventsToNoteLoopEvents(
          selectedClipRef.current.noteEvents,
        ),
        sampleEvents: drumEventsToSampleLoopEvents(
          selectedClipRef.current.drumEvents,
        ),
        startTick,
        tempoBpm: bpmRef.current,
      });
      commitPlayheadTick(snapshot.currentTick);
    } catch (error) {
      setTransportState("stopped");
      commitPlayheadTick(audioEngine.stopLoop().currentTick);
      setAudioError(
        error instanceof Error ? error.message : "Audio playback failed.",
      );
    }
  }

  async function updatePlayingClipEvents(clip: HybridClip) {
    setAudioError(null);

    try {
      await audioEngine.updateClipLoopEvents({
        noteEvents: noteEventsToNoteLoopEvents(clip.noteEvents),
        sampleEvents: drumEventsToSampleLoopEvents(clip.drumEvents),
      });
    } catch (error) {
      setAudioError(
        error instanceof Error ? error.message : "Audio clip update failed.",
      );
    }
  }

  return (
    <div className={styles.appShell}>
      <TransportBar
        bpm={bpm}
        mode={transportMode}
        onBpmChange={commitBpm}
        onModeChange={setTransportMode}
        onTransportStateChange={handleTransportStateChange}
        transportState={transportState}
      />

      <div className={styles.mainLayout}>
        <ProjectSidebar
          onInstrumentSelect={handleInstrumentSelect}
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
              <span>{selectedClip.noteEvents.length} note events</span>
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
              playheadTick={playheadTick}
              shouldShowPlayhead={shouldShowPlayhead}
              onStepToggle={handleDrumStepToggle}
              samples={BUNDLED_DRUM_SAMPLES}
            />
            <PianoRoll
              clipLengthTicks={selectedClip.lengthTicks}
              instrumentName={selectedPitchedInstrument.name}
              noteEvents={selectedPitchedNoteEvents}
              onNoteCreate={handleNoteCreate}
              onNoteDelete={handleNoteDelete}
              onNoteMove={handleNoteMove}
              playheadTick={playheadTick}
              shouldShowPlayhead={shouldShowPlayhead}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
