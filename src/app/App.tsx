import { useEffect, useRef, useState } from "react";

import {
  BUNDLED_DRUM_SAMPLES,
  createAudioEngine,
  type BundledSampleMeta,
  type NoteLoopEvent,
  type SampleLoopEvent,
} from "../audio";
import {
  ArrangementView,
  DrumSequencer,
  PianoRoll,
  ProjectSidebar,
  TransportBar,
  type InstrumentId,
  type TransportMode,
  type TransportState,
} from "../features";
import {
  DEFAULT_PITCHED_INSTRUMENT_ID,
  addPitchedInstrumentToClip,
  addNoteEvent,
  createEmptyHybridClip,
  deleteNoteEvent,
  getPitchedInstrument,
  hasNoteEventsForPitchedInstrument,
  moveDrumLane,
  moveNoteEvent,
  removePitchedInstrumentFromClip,
  renameClip,
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
const DEFAULT_CLIP_ID = "clip-1";

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

function createNextHybridClip(clips: readonly HybridClip[]): HybridClip {
  const nextClipNumber =
    clips.reduce((highestClipNumber, clip) => {
      const match = /^clip-(\d+)$/.exec(clip.id);
      const clipNumber = match ? Number.parseInt(match[1] ?? "", 10) : 0;

      return Math.max(highestClipNumber, Number.isNaN(clipNumber) ? 0 : clipNumber);
    }, 0) + 1;

  return createEmptyHybridClip({
    id: `clip-${nextClipNumber}`,
    name: `Clip ${nextClipNumber}`,
  });
}

export function App() {
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [transportMode, setTransportMode] = useState<TransportMode>("pattern");
  const [bpm, setBpm] = useState(DEFAULT_TEMPO_BPM);
  const bpmRef = useRef(DEFAULT_TEMPO_BPM);
  const [clips, setClips] = useState<HybridClip[]>(() => [
    createEmptyHybridClip({ id: DEFAULT_CLIP_ID, name: "Clip 1" }),
  ]);
  const clipsRef = useRef<HybridClip[]>(clips);
  const [selectedClipId, setSelectedClipId] = useState(DEFAULT_CLIP_ID);
  const [selectedInstrumentId, setSelectedInstrumentId] =
    useState<InstrumentId>("iowa-piano");
  const [selectedPitchedInstrumentId, setSelectedPitchedInstrumentId] =
    useState<PitchedInstrumentId>("iowa-piano");
  const selectedClip =
    clips.find((clip) => clip.id === selectedClipId) ?? clips[0]!;
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
    clipsRef.current = clips;
    selectedClipRef.current = selectedClip;
  }, [clips, selectedClip]);

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
    setClips((currentClips) => {
      const nextClips = currentClips.map((clip) =>
        clip.id === nextClip.id ? nextClip : clip,
      );

      clipsRef.current = nextClips;
      return nextClips;
    });

    if (transportState === "playing") {
      void updatePlayingClipEvents(nextClip);
    }
  }

  function commitClip(nextClip: HybridClip) {
    setClips((currentClips) => {
      const nextClips = currentClips.map((clip) =>
        clip.id === nextClip.id ? nextClip : clip,
      );

      clipsRef.current = nextClips;
      return nextClips;
    });

    if (nextClip.id === selectedClipRef.current.id) {
      selectedClipRef.current = nextClip;

      if (transportState === "playing") {
        void updatePlayingClipEvents(nextClip);
      }
    }
  }

  function selectClipAndInstrument(
    clip: HybridClip,
    instrumentId: InstrumentId,
  ) {
    selectedClipRef.current = clip;
    setSelectedClipId(clip.id);
    setSelectedInstrumentId(instrumentId);

    if (instrumentId !== "drums") {
      setSelectedPitchedInstrumentId(instrumentId);
      return;
    }

    setSelectedPitchedInstrumentId(
      clip.pitchedInstrumentIds[0] ?? DEFAULT_PITCHED_INSTRUMENT_ID,
    );
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

  function handleClipAdd() {
    const nextClip = createNextHybridClip(clipsRef.current);
    const nextClips = [...clipsRef.current, nextClip];

    clipsRef.current = nextClips;
    setClips(nextClips);
    selectClipAndInstrument(
      nextClip,
      nextClip.pitchedInstrumentIds[0] ?? "drums",
    );

    if (transportState === "playing") {
      void updatePlayingClipEvents(nextClip);
    }
  }

  function handleClipSelect(clipId: string) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    const nextInstrumentId =
      selectedInstrumentId !== "drums" &&
      clip.pitchedInstrumentIds.includes(selectedInstrumentId)
        ? selectedInstrumentId
        : "drums";

    selectClipAndInstrument(clip, nextInstrumentId);

    if (transportState === "playing") {
      void updatePlayingClipEvents(clip);
    }
  }

  function handleClipRename(clipId: string, name: string) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    commitClip(renameClip({ clip, name }));
  }

  function handleClipDelete(clipId: string) {
    const currentClips = clipsRef.current;

    if (currentClips.length <= 1) {
      return;
    }

    const clipIndex = currentClips.findIndex((clip) => clip.id === clipId);
    const clip = currentClips[clipIndex];

    if (!clip) {
      return;
    }

    const hasClipData = clip.drumEvents.length > 0 || clip.noteEvents.length > 0;

    if (
      hasClipData &&
      !window.confirm(`Delete ${clip.name} and its musical events?`)
    ) {
      return;
    }

    const nextClips = currentClips.filter((candidate) => candidate.id !== clipId);
    const fallbackClip =
      nextClips[Math.max(0, Math.min(clipIndex, nextClips.length - 1))];

    if (!fallbackClip) {
      return;
    }

    clipsRef.current = nextClips;
    setClips(nextClips);

    if (clipId === selectedClipId) {
      selectClipAndInstrument(
        fallbackClip,
        fallbackClip.pitchedInstrumentIds[0] ?? "drums",
      );

      if (transportState === "playing") {
        void updatePlayingClipEvents(fallbackClip);
      }
    }
  }

  function handleInstrumentSelect(clipId: string, instrumentId: InstrumentId) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    const isSelectingDifferentClip = clip.id !== selectedClipRef.current.id;

    selectClipAndInstrument(clip, instrumentId);

    if (transportState === "playing" && isSelectingDifferentClip) {
      void updatePlayingClipEvents(clip);
    }
  }

  function handleInstrumentAdd(
    clipId: string,
    instrumentId: PitchedInstrumentId,
  ) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    const nextClip = addPitchedInstrumentToClip({ clip, instrumentId });
    const isSelectingDifferentClip = nextClip.id !== selectedClipRef.current.id;

    commitClip(nextClip);
    selectClipAndInstrument(nextClip, instrumentId);

    if (transportState === "playing" && isSelectingDifferentClip) {
      void updatePlayingClipEvents(nextClip);
    }
  }

  function handleInstrumentRemove(
    clipId: string,
    instrumentId: PitchedInstrumentId,
  ) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    if (clip.pitchedInstrumentIds.length <= 1) {
      return;
    }

    const hasOwnedNotes = hasNoteEventsForPitchedInstrument({
      clip,
      instrumentId,
    });

    if (
      hasOwnedNotes &&
      !window.confirm(
        "Remove this instrument and delete its piano roll notes from the clip?",
      )
    ) {
      return;
    }

    const nextClip = removePitchedInstrumentFromClip({
      clip,
      instrumentId,
      removeOwnedNotes: hasOwnedNotes,
    });

    commitClip(nextClip);

    if (clip.id === selectedClipId && selectedInstrumentId === instrumentId) {
      selectClipAndInstrument(
        nextClip,
        nextClip.pitchedInstrumentIds[0] ?? "drums",
      );
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
          clips={clips}
          onClipAdd={handleClipAdd}
          onClipDelete={handleClipDelete}
          onClipRename={handleClipRename}
          onClipSelect={handleClipSelect}
          onInstrumentAdd={handleInstrumentAdd}
          onInstrumentRemove={handleInstrumentRemove}
          onInstrumentSelect={handleInstrumentSelect}
          selectedClipId={selectedClip.id}
          selectedInstrumentId={selectedInstrumentId}
        />

        <main
          className={`${styles.workspace} ${
            transportMode === "song" ? styles.workspaceSong : ""
          }`}
          aria-label={
            transportMode === "song" ? "Arrangement workspace" : "Hybrid clip editor"
          }
        >
          {transportMode === "song" ? (
            <ArrangementView />
          ) : (
            <>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
