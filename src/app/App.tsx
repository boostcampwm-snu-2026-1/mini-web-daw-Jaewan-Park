import { useEffect, useRef, useState } from "react";

import {
  BUNDLED_DRUM_SAMPLES,
  createAudioEngine,
  expandClipInstancesForPlayback,
  type BundledSampleMeta,
  type MixerLevelSnapshot,
  type NoteLoopEvent,
  type SampleLoopEvent,
} from "../audio";
import {
  AudioClipDetails,
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
  createClipInstance,
  createDefaultArrangementLoopRange,
  createDefaultArrangementTracks,
  createDefaultMasterMixerState,
  createDefaultTrackMixerStates,
  createImportedAudioClipDraft,
  createImportedAudioIds,
  createEmptyHybridClip,
  deleteClipInstance,
  deleteNoteEvent,
  getPitchedInstrument,
  hasNoteEventsForPitchedInstrument,
  isAudioClip,
  isHybridClip,
  moveDrumLane,
  moveClipInstance,
  moveNoteEvent,
  normalizeArrangementLoopRange,
  removePitchedInstrumentFromClip,
  renameClip,
  toggleDrumSubstep,
  validateImportedWavFile,
  updateMasterMixerState,
  updateDrumLaneSample,
  updateDrumStepSubdivision,
  updateTrackMixerState,
  type ArrangementLoopRange,
  type ArrangementTrack,
  type AudioClip,
  type Clip,
  type ClipInstance,
  type DrumEvent,
  type DrumLaneId,
  type DrumStepSubdivision,
  type HybridClip,
  type MasterMixerState,
  type NoteEvent,
  type PitchedInstrumentId,
  type SampleMeta,
  type TrackMixerState,
} from "../model";
import {
  createIndexedDbProjectStore,
  createPersistedProjectDocument,
  getImportedSampleIds,
} from "../persistence";
import { DEFAULT_TEMPO_BPM, clampTempoBpm, type Tick } from "../utils";
import styles from "./App.module.css";

const audioEngine = createAudioEngine();
const projectStore = createIndexedDbProjectStore();
const DEFAULT_CLIP_ID = "clip-1";
const PROJECT_NAME = "Project 1";
const AUTOSAVE_DEBOUNCE_MS = 600;

type PersistenceStatus = "error" | "loading" | "saved" | "saving";

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

function createEmptyMixerLevels(
  tracks: readonly ArrangementTrack[],
): MixerLevelSnapshot {
  return {
    masterLevel: 0,
    trackLevels: Object.fromEntries(tracks.map((track) => [track.id, 0])),
  };
}

function createNextHybridClip(clips: readonly Clip[]): HybridClip {
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

function getPersistenceStatusLabel(status: PersistenceStatus): string {
  if (status === "loading") {
    return "Loading project";
  }

  if (status === "saving") {
    return "Saving";
  }

  if (status === "error") {
    return "Save failed";
  }

  return "Saved";
}

export function App() {
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [transportMode, setTransportMode] = useState<TransportMode>("pattern");
  const [bpm, setBpm] = useState(DEFAULT_TEMPO_BPM);
  const bpmRef = useRef(DEFAULT_TEMPO_BPM);
  const [clips, setClips] = useState<Clip[]>(() => [
    createEmptyHybridClip({ id: DEFAULT_CLIP_ID, name: "Clip 1" }),
  ]);
  const clipsRef = useRef<Clip[]>(clips);
  const [arrangementTracks, setArrangementTracks] = useState<ArrangementTrack[]>(() =>
    createDefaultArrangementTracks(),
  );
  const [trackMixerStates, setTrackMixerStates] = useState<TrackMixerState[]>(
    () => createDefaultTrackMixerStates(arrangementTracks),
  );
  const trackMixerStatesRef = useRef<TrackMixerState[]>(trackMixerStates);
  const [masterMixerState, setMasterMixerState] = useState<MasterMixerState>(() =>
    createDefaultMasterMixerState(),
  );
  const masterMixerStateRef = useRef<MasterMixerState>(masterMixerState);
  const [mixerLevels, setMixerLevels] = useState<MixerLevelSnapshot>(() =>
    createEmptyMixerLevels(arrangementTracks),
  );
  const [arrangementLoopRange, setArrangementLoopRange] =
    useState<ArrangementLoopRange>(() => createDefaultArrangementLoopRange());
  const arrangementLoopRangeRef =
    useRef<ArrangementLoopRange>(arrangementLoopRange);
  const [clipInstances, setClipInstances] = useState<ClipInstance[]>([]);
  const clipInstancesRef = useRef<ClipInstance[]>(clipInstances);
  const [selectedClipInstanceId, setSelectedClipInstanceId] = useState<
    string | null
  >(null);
  const [sampleMetas, setSampleMetas] = useState<SampleMeta[]>([]);
  const sampleMetasRef = useRef<SampleMeta[]>(sampleMetas);
  const [isClipImporting, setIsClipImporting] = useState(false);
  const [clipImportError, setClipImportError] = useState<string | null>(null);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>("loading");
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const durablePersistenceErrorRef = useRef<string | null>(null);
  const importedSampleBlobsRef = useRef<Map<string, Blob>>(new Map());
  const [selectedClipId, setSelectedClipId] = useState(DEFAULT_CLIP_ID);
  const [selectedInstrumentId, setSelectedInstrumentId] =
    useState<InstrumentId>("drums");
  const [selectedPitchedInstrumentId, setSelectedPitchedInstrumentId] =
    useState<PitchedInstrumentId>(DEFAULT_PITCHED_INSTRUMENT_ID);
  const selectedClip =
    clips.find((clip) => clip.id === selectedClipId) ?? clips[0]!;
  const selectedClipRef = useRef<Clip>(selectedClip);
  const selectedHybridClip = isHybridClip(selectedClip) ? selectedClip : null;
  const selectedAudioClip = isAudioClip(selectedClip) ? selectedClip : null;
  const selectedSampleMeta = selectedAudioClip
    ? sampleMetas.find((sampleMeta) => sampleMeta.id === selectedAudioClip.sampleId)
    : undefined;
  const [playheadTick, setPlayheadTick] = useState<Tick>(0);
  const playheadTickRef = useRef<Tick>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioClipPreviewPlaying, setIsAudioClipPreviewPlaying] =
    useState(false);
  const shouldShowPlayhead = transportState !== "stopped";
  const hasSelectedPitchedInstrument =
    selectedHybridClip?.pitchedInstrumentIds.includes(selectedPitchedInstrumentId) ??
    false;
  const selectedPitchedInstrumentName = hasSelectedPitchedInstrument
    ? getPitchedInstrument(selectedPitchedInstrumentId).name
    : "-";
  const selectedPitchedNoteEvents = hasSelectedPitchedInstrument
    ? selectedHybridClip?.noteEvents.filter(
        (event) => event.instrumentId === selectedPitchedInstrumentId,
      ) ?? []
    : [];

  useEffect(() => {
    clipsRef.current = clips;
    selectedClipRef.current = selectedClip;
  }, [clips, selectedClip]);

  useEffect(() => {
    clipInstancesRef.current = clipInstances;
  }, [clipInstances]);

  useEffect(() => {
    arrangementLoopRangeRef.current = arrangementLoopRange;
  }, [arrangementLoopRange]);

  useEffect(() => {
    sampleMetasRef.current = sampleMetas;
  }, [sampleMetas]);

  useEffect(() => {
    let isCancelled = false;

    async function restoreProject() {
      let shouldEnableAutosave = true;

      try {
        const persistedProject = await projectStore.loadActiveProject();

        if (isCancelled) {
          return;
        }

        if (persistedProject) {
          const restoredTracks =
            persistedProject.arrangementTracks.length > 0
              ? persistedProject.arrangementTracks
              : createDefaultArrangementTracks();
          const restoredClips =
            persistedProject.clips.length > 0
              ? persistedProject.clips
              : [createEmptyHybridClip({ id: DEFAULT_CLIP_ID, name: "Clip 1" })];
          const restoredBpm = clampTempoBpm(persistedProject.tempoBpm);
          const restoredLoopRange = normalizeArrangementLoopRange(
            persistedProject.arrangementLoopRange,
          );
          const restoredTrackMixerStates =
            persistedProject.trackMixerStates.length > 0
              ? persistedProject.trackMixerStates
              : createDefaultTrackMixerStates(restoredTracks);
          const restoredMasterMixerState =
            persistedProject.masterMixerState ?? createDefaultMasterMixerState();
          const restoredClip = restoredClips[0]!;

          bpmRef.current = audioEngine.setTempoBpm(restoredBpm).tempoBpm;
          clipsRef.current = restoredClips;
          arrangementLoopRangeRef.current = restoredLoopRange;
          clipInstancesRef.current = persistedProject.clipInstances;
          sampleMetasRef.current = persistedProject.sampleMetas;
          selectedClipRef.current = restoredClip;
          trackMixerStatesRef.current = restoredTrackMixerStates;
          masterMixerStateRef.current = restoredMasterMixerState;

          setBpm(bpmRef.current);
          setClips(restoredClips);
          setArrangementTracks(restoredTracks);
          setArrangementLoopRange(restoredLoopRange);
          setClipInstances(persistedProject.clipInstances);
          setSampleMetas(persistedProject.sampleMetas);
          setTrackMixerStates(restoredTrackMixerStates);
          setMasterMixerState(restoredMasterMixerState);
          setMixerLevels(createEmptyMixerLevels(restoredTracks));
          setSelectedClipId(restoredClip.id);
          setSelectedClipInstanceId(null);

          if (isAudioClip(restoredClip)) {
            setSelectedInstrumentId("audio");
          } else {
            setSelectedInstrumentId(restoredClip.pitchedInstrumentIds[0] ?? "drums");
            setSelectedPitchedInstrumentId(
              restoredClip.pitchedInstrumentIds[0] ??
                DEFAULT_PITCHED_INSTRUMENT_ID,
            );
          }

          const importedSampleIds = getImportedSampleIds(persistedProject);
          const importedSampleBlobs = await Promise.all(
            importedSampleIds.map(async (sampleId) => ({
              blob: await projectStore.loadImportedSampleBlob(sampleId),
              sampleId,
            })),
          );

          if (isCancelled) {
            return;
          }

          const restoredBlobMap = new Map<string, Blob>();
          const missingSampleIds: string[] = [];

          for (const { blob, sampleId } of importedSampleBlobs) {
            if (blob) {
              restoredBlobMap.set(sampleId, blob);
            } else {
              missingSampleIds.push(sampleId);
            }
          }

          importedSampleBlobsRef.current = restoredBlobMap;

          if (missingSampleIds.length > 0) {
            const message = `Missing imported audio data for ${missingSampleIds.join(
              ", ",
            )}.`;
            durablePersistenceErrorRef.current = message;
            setPersistenceStatus("error");
            setPersistenceError(message);
          } else {
            durablePersistenceErrorRef.current = null;
            setPersistenceStatus("saved");
            setPersistenceError(null);
          }
        } else {
          durablePersistenceErrorRef.current = null;
          setPersistenceStatus("saved");
          setPersistenceError(null);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        shouldEnableAutosave = false;
        const message =
          error instanceof Error ? error.message : "Project restore failed.";
        durablePersistenceErrorRef.current = message;
        setPersistenceStatus("error");
        setPersistenceError(message);
      } finally {
        if (!isCancelled && shouldEnableAutosave) {
          setIsPersistenceReady(true);
        }
      }
    }

    void restoreProject();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      const projectDocument = createPersistedProjectDocument({
        arrangementLoopRange,
        arrangementTracks,
        clipInstances,
        clips,
        masterMixerState,
        name: PROJECT_NAME,
        sampleMetas,
        tempoBpm: bpm,
        trackMixerStates,
      });

      setPersistenceStatus("saving");
      projectStore
        .saveActiveProject(projectDocument)
        .then(() => {
          if (isCancelled) {
            return;
          }

          if (durablePersistenceErrorRef.current) {
            setPersistenceStatus("error");
            setPersistenceError(durablePersistenceErrorRef.current);
          } else {
            setPersistenceStatus("saved");
            setPersistenceError(null);
          }
        })
        .catch((error: unknown) => {
          if (isCancelled) {
            return;
          }

          setPersistenceStatus("error");
          setPersistenceError(
            error instanceof Error ? error.message : "Project autosave failed.",
          );
        });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    arrangementLoopRange,
    arrangementTracks,
    bpm,
    clipInstances,
    clips,
    isPersistenceReady,
    masterMixerState,
    sampleMetas,
    trackMixerStates,
  ]);

  useEffect(() => {
    trackMixerStatesRef.current = trackMixerStates;
    audioEngine.setTrackMixerStates(trackMixerStates);
  }, [trackMixerStates]);

  useEffect(() => {
    masterMixerStateRef.current = masterMixerState;
    audioEngine.setMasterMixerState(masterMixerState);
  }, [masterMixerState]);

  useEffect(() => {
    return () => {
      audioEngine.stopCachedSamplePreview();
    };
  }, []);

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

  useEffect(() => {
    if (transportMode !== "song" || transportState !== "playing") {
      return;
    }

    let animationFrameId = 0;
    const trackIds = arrangementTracks.map((track) => track.id);

    function updateMixerLevels() {
      setMixerLevels(audioEngine.getMixerLevels(trackIds));
      animationFrameId = window.requestAnimationFrame(updateMixerLevels);
    }

    animationFrameId = window.requestAnimationFrame(updateMixerLevels);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [arrangementTracks, transportMode, transportState]);

  function commitSelectedClip(nextClip: HybridClip) {
    const nextClips = clipsRef.current.map((clip) =>
      clip.id === nextClip.id ? nextClip : clip,
    );

    selectedClipRef.current = nextClip;
    clipsRef.current = nextClips;
    setClips(nextClips);

    if (transportState === "playing" && transportMode === "song") {
      void updatePlayingArrangementEvents(nextClips);
    } else if (transportState === "playing") {
      void updatePlayingClipEvents(nextClip);
    }
  }

  function commitAnyClip(nextClip: Clip) {
    const nextClips = clipsRef.current.map((clip) =>
      clip.id === nextClip.id ? nextClip : clip,
    );

    clipsRef.current = nextClips;
    setClips(nextClips);

    if (nextClip.id === selectedClipRef.current.id) {
      selectedClipRef.current = nextClip;

      if (transportState === "playing" && transportMode === "song") {
        void updatePlayingArrangementEvents(nextClips);
      } else if (transportState === "playing" && isHybridClip(nextClip)) {
        void updatePlayingClipEvents(nextClip);
      }
    }
  }

  function commitClip(nextClip: HybridClip) {
    commitAnyClip(nextClip);
  }

  function selectClipAndInstrument(
    clip: HybridClip,
    instrumentId: Exclude<InstrumentId, "audio">,
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

  function selectClipDefault(clip: Clip) {
    selectedClipRef.current = clip;
    setSelectedClipId(clip.id);

    if (isAudioClip(clip)) {
      setSelectedInstrumentId("audio");
      return;
    }

    selectClipAndInstrument(clip, clip.pitchedInstrumentIds[0] ?? "drums");
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

  function commitClipInstances(nextClipInstances: ClipInstance[]) {
    clipInstancesRef.current = nextClipInstances;
    setClipInstances(nextClipInstances);
  }

  function commitArrangementLoopRange(nextLoopRange: ArrangementLoopRange) {
    const normalizedLoopRange = normalizeArrangementLoopRange(nextLoopRange);

    arrangementLoopRangeRef.current = normalizedLoopRange;
    setArrangementLoopRange(normalizedLoopRange);
  }

  function handleTrackVolumeChange(trackId: string, volumeDb: number) {
    setTrackMixerStates((currentStates) =>
      updateTrackMixerState(currentStates, trackId, { volumeDb }),
    );
  }

  function handleTrackMuteToggle(trackId: string) {
    setTrackMixerStates((currentStates) => {
      const currentState = currentStates.find(
        (state) => state.trackId === trackId,
      );

      return updateTrackMixerState(currentStates, trackId, {
        muted: !(currentState?.muted ?? false),
      });
    });
  }

  function handleTrackSoloToggle(trackId: string) {
    setTrackMixerStates((currentStates) => {
      const currentState = currentStates.find(
        (state) => state.trackId === trackId,
      );

      return updateTrackMixerState(currentStates, trackId, {
        solo: !(currentState?.solo ?? false),
      });
    });
  }

  function handleMasterVolumeChange(volumeDb: number) {
    setMasterMixerState((currentState) =>
      updateMasterMixerState(currentState, { volumeDb }),
    );
  }

  function getSelectedHybridClip(): HybridClip | null {
    const clip = selectedClipRef.current;

    return isHybridClip(clip) ? clip : null;
  }

  function markAudioClipPreviewStopped() {
    setIsAudioClipPreviewPlaying(false);
  }

  function stopAudioClipPreview() {
    audioEngine.stopCachedSamplePreview();
    markAudioClipPreviewStopped();
  }

  function reportPersistenceError(message: string) {
    setPersistenceStatus("error");
    setPersistenceError(message);
  }

  async function persistImportedSampleBlob(sampleId: string, file: File) {
    try {
      await projectStore.saveImportedSampleBlob({
        blob: file,
        fileName: file.name,
        mimeType: file.type,
        sampleId,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Imported audio file could not be saved locally.";
      durablePersistenceErrorRef.current = message;
      reportPersistenceError(message);
    }
  }

  async function ensureImportedAudioRuntimeSample(
    clip: AudioClip,
  ): Promise<boolean> {
    const loadedSampleIds = new Set(audioEngine.getSnapshot().loadedSampleIds);

    if (loadedSampleIds.has(clip.sampleId)) {
      return true;
    }

    const blob =
      importedSampleBlobsRef.current.get(clip.sampleId) ??
      (await projectStore.loadImportedSampleBlob(clip.sampleId));

    if (!blob) {
      return false;
    }

    importedSampleBlobsRef.current.set(clip.sampleId, blob);
    await audioEngine.importSampleBlob(clip.sampleId, blob, clip.sourceFileName);
    return true;
  }

  async function handleAudioClipPreviewPlay() {
    const clip = selectedClipRef.current;

    if (!isAudioClip(clip)) {
      return;
    }

    setAudioError(null);

    if (transportState !== "stopped") {
      const snapshot = audioEngine.stopLoop();

      setTransportState(snapshot.status);
      commitPlayheadTick(snapshot.currentTick);
    }

    try {
      const hasRuntimeSample = await ensureImportedAudioRuntimeSample(clip);

      if (!hasRuntimeSample) {
        throw new Error(
          `Imported audio data is missing for ${clip.name}. Re-import the file.`,
        );
      }

      await audioEngine.playCachedSample(clip.sampleId, { loop: true });
      setIsAudioClipPreviewPlaying(true);
    } catch (error) {
      markAudioClipPreviewStopped();
      setAudioError(
        error instanceof Error ? error.message : "Audio clip preview failed.",
      );
    }
  }

  function handleDrumStepToggle(
    laneId: DrumLaneId,
    stepIndex: number,
    substepIndex: number,
  ) {
    const clip = getSelectedHybridClip();

    if (!clip) {
      return;
    }

    commitSelectedClip(
      toggleDrumSubstep({
        clip,
        laneId,
        stepIndex,
        substepIndex,
      }),
    );
  }

  function handleDrumStepSubdivisionChange(
    subdivision: DrumStepSubdivision,
  ) {
    const clip = getSelectedHybridClip();

    if (!clip) {
      return;
    }

    commitSelectedClip(
      updateDrumStepSubdivision({
        clip,
        subdivision,
      }),
    );
  }

  function handleLaneSampleChange(
    laneId: DrumLaneId,
    sample: BundledSampleMeta,
  ) {
    const clip = getSelectedHybridClip();

    if (!clip) {
      return;
    }

    commitSelectedClip(
      updateDrumLaneSample({
        clip,
        label: sample.name,
        laneId,
        sampleId: sample.id,
      }),
    );
  }

  function handleLaneMove(laneId: DrumLaneId, targetIndex: number) {
    const clip = getSelectedHybridClip();

    if (!clip) {
      return;
    }

    commitSelectedClip(
      moveDrumLane({
        clip,
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
    const clip = getSelectedHybridClip();

    if (
      !clip ||
      !clip.pitchedInstrumentIds.includes(selectedPitchedInstrumentId)
    ) {
      return;
    }

    commitSelectedClip(
      addNoteEvent({
        clip,
        durationTicks,
        instrumentId: selectedPitchedInstrumentId,
        midiNote,
        startTick,
      }),
    );
  }

  function handleNoteDelete(noteId: string) {
    const clip = getSelectedHybridClip();

    if (!clip) {
      return;
    }

    commitSelectedClip(
      deleteNoteEvent({
        clip,
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
    const clip = getSelectedHybridClip();

    if (!clip) {
      return;
    }

    commitSelectedClip(
      moveNoteEvent({
        clip,
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

    if (transportState === "playing" && transportMode !== "song") {
      void updatePlayingClipEvents(nextClip);
    }
  }

  async function handleAudioClipImport(file: File) {
    setAudioError(null);
    setClipImportError(null);
    stopAudioClipPreview();

    try {
      validateImportedWavFile(file);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Only WAV files can be imported.";

      setClipImportError(message);
      setAudioError(message);
      return;
    }

    const { clipId, sampleId } = createImportedAudioIds({
      existingClipIds: clipsRef.current.map((clip) => clip.id),
      existingSampleIds: sampleMetasRef.current.map((sampleMeta) => sampleMeta.id),
      fileName: file.name,
    });

    setIsClipImporting(true);

    try {
      const audioBuffer = await audioEngine.importSampleFile(sampleId, file);
      const { clip, sampleMeta } = createImportedAudioClipDraft({
        clipId,
        durationSeconds: audioBuffer.duration,
        fileName: file.name,
        mimeType: file.type,
        sampleId,
      });
      const nextClips = [...clipsRef.current, clip];
      const nextSampleMetas = [...sampleMetasRef.current, sampleMeta];

      importedSampleBlobsRef.current.set(sampleId, file);
      clipsRef.current = nextClips;
      sampleMetasRef.current = nextSampleMetas;
      setClips(nextClips);
      setSampleMetas(nextSampleMetas);
      selectClipDefault(clip);
      void persistImportedSampleBlob(sampleId, file);

      if (transportState === "playing" && transportMode !== "song") {
        const snapshot = audioEngine.stopLoop();

        setTransportState(snapshot.status);
        commitPlayheadTick(snapshot.currentTick);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to import the selected WAV file.";

      setClipImportError(message);
      setAudioError(message);
    } finally {
      setIsClipImporting(false);
    }
  }

  function handleClipSelect(clipId: string) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    stopAudioClipPreview();

    if (isAudioClip(clip)) {
      selectClipDefault(clip);

      if (transportState === "playing" && transportMode !== "song") {
        const snapshot = audioEngine.stopLoop();

        setTransportState(snapshot.status);
        commitPlayheadTick(snapshot.currentTick);
      }

      return;
    }

    const nextInstrumentId =
      selectedInstrumentId !== "drums" &&
      selectedInstrumentId !== "audio" &&
      clip.pitchedInstrumentIds.includes(selectedInstrumentId)
        ? selectedInstrumentId
        : "drums";

    selectClipAndInstrument(clip, nextInstrumentId);

    if (transportState === "playing" && transportMode !== "song") {
      void updatePlayingClipEvents(clip);
    }
  }

  function handleClipRename(clipId: string, name: string) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    commitAnyClip(renameClip({ clip, name }));
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

    const hasClipData = isAudioClip(clip)
      ? true
      : clip.drumEvents.length > 0 || clip.noteEvents.length > 0;

    if (
      hasClipData &&
      !window.confirm(
        isAudioClip(clip)
          ? `Delete imported audio clip ${clip.name}?`
          : `Delete ${clip.name} and its musical events?`,
      )
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
    const nextClipInstances = clipInstancesRef.current.filter(
      (instance) => instance.clipId !== clipId,
    );

    commitClipInstances(nextClipInstances);

    if (
      selectedClipInstanceId &&
      clipInstancesRef.current.every(
        (instance) => instance.id !== selectedClipInstanceId,
      )
    ) {
      setSelectedClipInstanceId(null);
    }

    if (clipId === selectedClipId) {
      stopAudioClipPreview();
      selectClipDefault(fallbackClip);

      if (
        transportState === "playing" &&
        transportMode !== "song" &&
        isHybridClip(fallbackClip)
      ) {
        void updatePlayingClipEvents(fallbackClip);
      } else if (transportState === "playing" && transportMode !== "song") {
        const snapshot = audioEngine.stopLoop();

        setTransportState(snapshot.status);
        commitPlayheadTick(snapshot.currentTick);
      }
    }

    if (transportState === "playing" && transportMode === "song") {
      void updatePlayingArrangementEvents(nextClips, nextClipInstances);
    }
  }

  function handleInstrumentSelect(clipId: string, instrumentId: InstrumentId) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip || !isHybridClip(clip) || instrumentId === "audio") {
      return;
    }

    const isSelectingDifferentClip = clip.id !== selectedClipRef.current.id;

    selectClipAndInstrument(clip, instrumentId);

    if (
      transportState === "playing" &&
      transportMode !== "song" &&
      isSelectingDifferentClip
    ) {
      void updatePlayingClipEvents(clip);
    }
  }

  function handleInstrumentAdd(
    clipId: string,
    instrumentId: PitchedInstrumentId,
  ) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip || !isHybridClip(clip)) {
      return;
    }

    const nextClip = addPitchedInstrumentToClip({ clip, instrumentId });
    const isSelectingDifferentClip = nextClip.id !== selectedClipRef.current.id;

    commitClip(nextClip);
    selectClipAndInstrument(nextClip, instrumentId);

    if (
      transportState === "playing" &&
      transportMode !== "song" &&
      isSelectingDifferentClip
    ) {
      void updatePlayingClipEvents(nextClip);
    }
  }

  function handleInstrumentRemove(
    clipId: string,
    instrumentId: PitchedInstrumentId,
  ) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip || !isHybridClip(clip)) {
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

  function handleArrangementClipDrop({
    clipId,
    startTick,
    trackId,
  }: {
    clipId: string;
    startTick: Tick;
    trackId: string;
  }) {
    const clip = clipsRef.current.find((candidate) => candidate.id === clipId);

    if (!clip) {
      return;
    }

    const nextInstance = createClipInstance({
      clip,
      existingInstanceIds: clipInstancesRef.current.map(
        (instance) => instance.id,
      ),
      startTick,
      tempoBpm: bpmRef.current,
      trackId,
    });
    const nextClipInstances = [...clipInstancesRef.current, nextInstance];

    commitClipInstances(nextClipInstances);
    setSelectedClipInstanceId(nextInstance.id);
    setAudioError(null);

    if (transportState === "playing" && transportMode === "song") {
      void updatePlayingArrangementEvents(clipsRef.current, nextClipInstances);
    }
  }

  function handleClipInstanceMove({
    instanceId,
    startTick,
    trackId,
  }: {
    instanceId: string;
    startTick: Tick;
    trackId: string;
  }) {
    const nextClipInstances = clipInstancesRef.current.map((instance) =>
      instance.id === instanceId
        ? moveClipInstance({ instance, startTick, trackId })
        : instance,
    );

    commitClipInstances(nextClipInstances);
    setSelectedClipInstanceId(instanceId);

    if (transportState === "playing" && transportMode === "song") {
      void updatePlayingArrangementEvents(clipsRef.current, nextClipInstances);
    }
  }

  function handleClipInstanceDelete(instanceId: string) {
    const nextClipInstances = deleteClipInstance(
      clipInstancesRef.current,
      instanceId,
    );

    commitClipInstances(nextClipInstances);

    if (selectedClipInstanceId === instanceId) {
      setSelectedClipInstanceId(null);
    }

    if (transportState === "playing" && transportMode === "song") {
      void updatePlayingArrangementEvents(clipsRef.current, nextClipInstances);
    }
  }

  function handleArrangementLoopRangeChange(nextLoopRange: ArrangementLoopRange) {
    const normalizedLoopRange = normalizeArrangementLoopRange(nextLoopRange);

    commitArrangementLoopRange(normalizedLoopRange);
    setAudioError(null);

    if (transportState === "playing" && transportMode === "song") {
      void restartArrangementPlayback(normalizedLoopRange.startTick, normalizedLoopRange);
    }
  }

  function handleTransportModeChange(nextTransportMode: TransportMode) {
    if (nextTransportMode === transportMode) {
      return;
    }

    stopAudioClipPreview();
    setMixerLevels(createEmptyMixerLevels(arrangementTracks));

    if (transportState !== "stopped") {
      const snapshot = audioEngine.stopLoop();

      setTransportState(snapshot.status);
      commitPlayheadTick(snapshot.currentTick);
    }

    setTransportMode(nextTransportMode);
  }

  async function restartArrangementPlayback(
    startTick: Tick,
    loopRange = arrangementLoopRangeRef.current,
  ) {
    try {
      const snapshot = await startArrangementPlayback(startTick, loopRange);

      setTransportState("playing");
      commitPlayheadTick(snapshot.currentTick);
    } catch (error) {
      setTransportState("stopped");
      commitPlayheadTick(audioEngine.stopLoop().currentTick);
      setMixerLevels(createEmptyMixerLevels(arrangementTracks));
      setAudioError(
        error instanceof Error ? error.message : "Arrangement playback failed.",
      );
    }
  }

  async function startArrangementPlayback(
    startTick: Tick,
    loopRange = arrangementLoopRangeRef.current,
  ) {
    const currentClipInstances = clipInstancesRef.current;
    const normalizedLoopRange = normalizeArrangementLoopRange(loopRange);

    if (currentClipInstances.length === 0) {
      throw new Error("Place at least one clip in the arrangement before playback.");
    }

    const missingImportedAudioClipNames = await getMissingImportedAudioRuntimeClipNames(
      currentClipInstances,
    );

    if (missingImportedAudioClipNames.length > 0) {
      throw new Error(
        `Imported audio data is missing for ${missingImportedAudioClipNames.join(
          ", ",
        )}. Re-import the file in this session to play it.`,
      );
    }

    const playbackEvents = buildArrangementPlaybackEvents({
      clipInstances: currentClipInstances,
      clips: clipsRef.current,
    });

    audioEngine.setTrackMixerStates(trackMixerStatesRef.current);
    audioEngine.setMasterMixerState(masterMixerStateRef.current);

    return audioEngine.startClipLoop({
      loopEndTick: normalizedLoopRange.endTick,
      loopStartTick: normalizedLoopRange.startTick,
      noteEvents: playbackEvents.noteEvents,
      sampleEvents: playbackEvents.sampleEvents,
      startTick: getArrangementPlaybackStartTick(startTick, normalizedLoopRange),
      tempoBpm: bpmRef.current,
    });
  }

  async function updatePlayingArrangementEvents(
    nextClips = clipsRef.current,
    nextClipInstances = clipInstancesRef.current,
  ) {
    setAudioError(null);

    try {
      const missingImportedAudioClipNames =
        await getMissingImportedAudioRuntimeClipNames(nextClipInstances);

      if (missingImportedAudioClipNames.length > 0) {
        throw new Error(
          `Imported audio data is missing for ${missingImportedAudioClipNames.join(
            ", ",
          )}. Re-import the file in this session to play it.`,
        );
      }

      const playbackEvents = buildArrangementPlaybackEvents({
        clipInstances: nextClipInstances,
        clips: nextClips,
      });

      await audioEngine.updateClipLoopEvents({
        noteEvents: playbackEvents.noteEvents,
        sampleEvents: playbackEvents.sampleEvents,
      });
    } catch (error) {
      setAudioError(
        error instanceof Error
          ? error.message
          : "Arrangement playback update failed.",
      );
    }
  }

  function buildArrangementPlaybackEvents({
    clipInstances: instances,
    clips: sourceClips,
  }: {
    clipInstances: readonly ClipInstance[];
    clips: readonly Clip[];
  }) {
    const playbackEvents = expandClipInstancesForPlayback({
      clipInstances: instances,
      clips: sourceClips,
    });

    if (playbackEvents.missingClipIds.length > 0) {
      throw new Error(
        `Arrangement contains missing source clips: ${playbackEvents.missingClipIds.join(
          ", ",
        )}.`,
      );
    }

    return playbackEvents;
  }

  async function getMissingImportedAudioRuntimeClipNames(
    instances: readonly ClipInstance[],
  ): Promise<string[]> {
    const missingClipNames: string[] = [];

    for (const instance of instances) {
      const clip = clipsRef.current.find(
        (candidate) => candidate.id === instance.clipId,
      );

      if (!clip || !isAudioClip(clip)) {
        continue;
      }

      if (!(await ensureImportedAudioRuntimeSample(clip))) {
        missingClipNames.push(clip.name);
      }
    }

    return missingClipNames;
  }

  function getArrangementPlaybackStartTick(
    startTick: Tick,
    loopRange: ArrangementLoopRange,
  ): Tick {
    if (startTick >= loopRange.startTick && startTick < loopRange.endTick) {
      return startTick;
    }

    return loopRange.startTick;
  }

  async function handleTransportStateChange(nextTransportState: TransportState) {
    setAudioError(null);

    if (nextTransportState === "stopped") {
      stopAudioClipPreview();
      const snapshot = audioEngine.stopLoop();
      setTransportState(snapshot.status);
      commitPlayheadTick(snapshot.currentTick);
      setMixerLevels(createEmptyMixerLevels(arrangementTracks));
      return;
    }

    if (nextTransportState === "paused") {
      stopAudioClipPreview();
      const snapshot = audioEngine.pauseLoop();
      setTransportState(snapshot.status);
      commitPlayheadTick(snapshot.currentTick);
      setMixerLevels(createEmptyMixerLevels(arrangementTracks));
      return;
    }

    const startTick = transportState === "paused" ? playheadTickRef.current : 0;
    const clip = selectedClipRef.current;
    stopAudioClipPreview();

    if (transportMode === "song") {
      setTransportState("playing");
      await restartArrangementPlayback(startTick);

      return;
    }

    if (!isHybridClip(clip)) {
      await handleAudioClipPreviewPlay();
      return;
    }

    setTransportState("playing");

    try {
      const snapshot = await audioEngine.startClipLoop({
        noteEvents: noteEventsToNoteLoopEvents(
          clip.noteEvents,
        ),
        sampleEvents: drumEventsToSampleLoopEvents(
          clip.drumEvents,
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
        onModeChange={handleTransportModeChange}
        onTransportStateChange={handleTransportStateChange}
        persistenceStatusLabel={getPersistenceStatusLabel(persistenceStatus)}
        persistenceStatusTitle={persistenceError ?? undefined}
        persistenceStatusTone={persistenceStatus === "error" ? "error" : "default"}
        transportState={transportState}
      />

      <div className={styles.mainLayout}>
        <ProjectSidebar
          clipImportError={clipImportError}
          clips={clips}
          isClipImporting={isClipImporting}
          onClipAdd={handleClipAdd}
          onClipDelete={handleClipDelete}
          onClipImport={handleAudioClipImport}
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
            <ArrangementView
              clipInstances={clipInstances}
              clips={clips}
              errorMessage={audioError}
              loopRange={arrangementLoopRange}
              onClipDrop={handleArrangementClipDrop}
              onClipInstanceDelete={handleClipInstanceDelete}
              onClipInstanceMove={handleClipInstanceMove}
              onClipInstanceSelect={setSelectedClipInstanceId}
              onLoopRangeChange={handleArrangementLoopRangeChange}
              onMasterVolumeChange={handleMasterVolumeChange}
              onTrackMuteToggle={handleTrackMuteToggle}
              onTrackSoloToggle={handleTrackSoloToggle}
              onTrackVolumeChange={handleTrackVolumeChange}
              playheadTick={playheadTick}
              masterMixerState={masterMixerState}
              mixerLevels={mixerLevels}
              selectedClipInstanceId={selectedClipInstanceId}
              shouldShowPlayhead={shouldShowPlayhead}
              trackMixerStates={trackMixerStates}
              tracks={arrangementTracks}
            />
          ) : selectedAudioClip ? (
            <>
              <header className={styles.workspaceHeader}>
                <div>
                  <p className={styles.eyebrow}>Imported Audio Clip</p>
                  <h1 className={styles.title}>{selectedAudioClip.name}</h1>
                </div>
                <div className={styles.clipMeta}>
                  <span>WAV</span>
                  <span>{selectedAudioClip.durationSeconds.toFixed(2)} sec</span>
                  <span>Stored locally</span>
                  {audioError ? (
                    <span className={styles.errorMeta}>{audioError}</span>
                  ) : null}
                </div>
              </header>

              <div className={styles.singlePanel}>
                <AudioClipDetails
                  clip={selectedAudioClip}
                  errorMessage={audioError}
                  isPreviewPlaying={isAudioClipPreviewPlaying}
                  onPreviewPlay={handleAudioClipPreviewPlay}
                  onPreviewStop={stopAudioClipPreview}
                  sampleMeta={selectedSampleMeta}
                />
              </div>
            </>
          ) : selectedHybridClip ? (
            <>
              <header className={styles.workspaceHeader}>
                <div>
                  <p className={styles.eyebrow}>M1 Hybrid Clip Editor</p>
                  <h1 className={styles.title}>{selectedHybridClip.name}</h1>
                </div>
                <div className={styles.clipMeta}>
                  <span>1 bar</span>
                  <span>4/4</span>
                  <span>PPQ 480</span>
                  <span>{selectedHybridClip.drumEvents.length} drum events</span>
                  <span>{selectedHybridClip.noteEvents.length} note events</span>
                  {audioError ? (
                    <span className={styles.errorMeta}>{audioError}</span>
                  ) : null}
                </div>
              </header>

              <div className={styles.editorStack}>
                <DrumSequencer
                  drumEvents={selectedHybridClip.drumEvents}
                  drumLanes={selectedHybridClip.drumLanes}
                  drumStepSubdivision={selectedHybridClip.drumStepSubdivision}
                  onLaneMove={handleLaneMove}
                  onLaneSampleChange={handleLaneSampleChange}
                  onSubdivisionChange={handleDrumStepSubdivisionChange}
                  playheadTick={playheadTick}
                  shouldShowPlayhead={shouldShowPlayhead}
                  onStepToggle={handleDrumStepToggle}
                  samples={BUNDLED_DRUM_SAMPLES}
                />
                <PianoRoll
                  clipLengthTicks={selectedHybridClip.lengthTicks}
                  instrumentName={selectedPitchedInstrumentName}
                  noteEvents={selectedPitchedNoteEvents}
                  onNoteCreate={handleNoteCreate}
                  onNoteDelete={handleNoteDelete}
                  onNoteMove={handleNoteMove}
                  playheadTick={playheadTick}
                  shouldShowPlayhead={shouldShowPlayhead}
                />
              </div>
            </>
          ) : (
            null
          )}
        </main>
      </div>
    </div>
  );
}
