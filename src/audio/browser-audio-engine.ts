import { BUNDLED_SAMPLES } from "./bundled-samples";
import { LookaheadScheduler } from "./lookahead-scheduler";
import type {
  AudioEngine,
  AudioEngineSnapshot,
  BundledSampleMeta,
  NoteLoopEvent,
  PlaySampleOptions,
  SampleId,
  SampleLoopEvent,
  StartClipLoopOptions,
  StartSampleLoopOptions,
  TransportSnapshot,
} from "./types";
import {
  getPitchedInstrument,
  getSampleZoneForMidiNote,
  resolveSustainLoopRegion,
} from "../model";
import { TICKS_PER_4_4_BAR, ticksToSeconds } from "../utils";

const DEFAULT_SAMPLE_GAIN = 0.9;
const DEFAULT_SYNTH_GAIN = 0.22;
const DEFAULT_PIANO_GAIN = 0.72;
const DEFAULT_TRANSPORT_TEMPO_BPM = 120;

type AudioContextConstructor = new () => AudioContext;

type ClipLoopEvent =
  | ({ kind: "note" } & NoteLoopEvent)
  | ({ kind: "sample" } & SampleLoopEvent);

interface ActiveNoteVoice {
  gainNode: GainNode;
  sourceNode: AudioScheduledSourceNode;
}

export function createAudioEngine(
  samples: readonly BundledSampleMeta[] = BUNDLED_SAMPLES,
): AudioEngine {
  return new BrowserAudioEngine(samples);
}

export class BrowserAudioEngine implements AudioEngine {
  private readonly samplesById: Map<SampleId, BundledSampleMeta>;
  private readonly sampleCache = new Map<SampleId, AudioBuffer>();
  private readonly loadingSamples = new Map<SampleId, Promise<AudioBuffer>>();
  private readonly activeNoteVoices = new Set<ActiveNoteVoice>();
  private audioContext: AudioContext | null = null;
  private sampleLoopUpdateToken = 0;
  private clipLoopScheduler: LookaheadScheduler<ClipLoopEvent> | null = null;

  constructor(samples: readonly BundledSampleMeta[]) {
    this.samplesById = new Map(samples.map((sample) => [sample.id, sample]));
  }

  getSnapshot(): AudioEngineSnapshot {
    return {
      contextState: this.audioContext?.state ?? "not-created",
      loadedSampleIds: Array.from(this.sampleCache.keys()),
      transport: this.getTransportSnapshot(),
    };
  }

  getTransportSnapshot(): TransportSnapshot {
    if (this.clipLoopScheduler) {
      return this.clipLoopScheduler.getSnapshot();
    }

    return {
      audioStartTime: null,
      currentTick: 0,
      loopEndTick: TICKS_PER_4_4_BAR,
      loopStartTick: 0,
      nextScheduleTick: 0,
      status: "stopped",
      tempoBpm: DEFAULT_TRANSPORT_TEMPO_BPM,
    };
  }

  async resume(): Promise<AudioEngineSnapshot> {
    const audioContext = this.getOrCreateAudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    return this.getSnapshot();
  }

  async suspend(): Promise<AudioEngineSnapshot> {
    this.stopLoop();

    if (this.audioContext && this.audioContext.state === "running") {
      await this.audioContext.suspend();
    }

    return this.getSnapshot();
  }

  async loadSample(sampleId: SampleId): Promise<AudioBuffer> {
    const cachedBuffer = this.sampleCache.get(sampleId);

    if (cachedBuffer) {
      return cachedBuffer;
    }

    const pendingLoad = this.loadingSamples.get(sampleId);

    if (pendingLoad) {
      return pendingLoad;
    }

    const sample = this.getSample(sampleId);
    const loadPromise = this.fetchAndDecodeSample(sample)
      .then((audioBuffer) => {
        this.sampleCache.set(sampleId, audioBuffer);
        return audioBuffer;
      })
      .finally(() => {
        this.loadingSamples.delete(sampleId);
      });

    this.loadingSamples.set(sampleId, loadPromise);
    return loadPromise;
  }

  async loadAllSamples(): Promise<AudioEngineSnapshot> {
    await Promise.all(
      Array.from(this.samplesById.keys(), (sampleId) => this.loadSample(sampleId)),
    );

    return this.getSnapshot();
  }

  async playSample(
    sampleId: SampleId,
    options: PlaySampleOptions = {},
  ): Promise<void> {
    await this.resume();
    await this.loadSample(sampleId);

    this.scheduleLoadedSample(sampleId, options);
  }

  async startSampleLoop({
    events,
    loopEndTick = TICKS_PER_4_4_BAR,
    loopStartTick = 0,
    lookaheadMs,
    ppq,
    scheduleAheadTime,
    startTick,
    tempoBpm,
  }: StartSampleLoopOptions): Promise<TransportSnapshot> {
    return this.startClipLoop({
      loopEndTick,
      loopStartTick,
      lookaheadMs,
      noteEvents: [],
      ppq,
      sampleEvents: events,
      scheduleAheadTime,
      startTick,
      tempoBpm,
    });
  }

  async startClipLoop({
    loopEndTick = TICKS_PER_4_4_BAR,
    loopStartTick = 0,
    lookaheadMs,
    noteEvents,
    ppq,
    sampleEvents,
    scheduleAheadTime,
    startTick,
    tempoBpm,
  }: StartClipLoopOptions): Promise<TransportSnapshot> {
    await this.resume();

    await Promise.all([
      this.loadSamplesForLoopEvents(sampleEvents),
      this.loadSamplesForNoteLoopEvents(noteEvents),
    ]);

    this.stopLoop();

    const audioContext = this.getOrCreateAudioContext();
    this.clipLoopScheduler = new LookaheadScheduler<ClipLoopEvent>({
      events: createClipLoopEvents({ noteEvents, sampleEvents }),
      getAudioTime: () => audioContext.currentTime,
      lookaheadMs,
      loopEndTick,
      loopStartTick,
      ppq,
      scheduleAheadTime,
      scheduleEvent: ({ audioTime, event }) => {
        if (event.kind === "sample") {
          this.scheduleLoadedSample(event.sampleId, {
            gain: event.gain,
            when: audioTime,
          });
          return;
        }

        this.schedulePitchedNote(event, {
          tempoBpm,
          when: audioTime,
        });
      },
      tempoBpm,
    });

    return this.clipLoopScheduler.start({ startTick });
  }

  pauseLoop(): TransportSnapshot {
    this.sampleLoopUpdateToken += 1;
    this.stopActiveNoteVoices();

    if (!this.clipLoopScheduler) {
      return this.getTransportSnapshot();
    }

    return this.clipLoopScheduler.pause();
  }

  stopLoop(): TransportSnapshot {
    this.sampleLoopUpdateToken += 1;
    this.stopActiveNoteVoices();

    if (!this.clipLoopScheduler) {
      return this.getTransportSnapshot();
    }

    const snapshot = this.clipLoopScheduler.stop();
    this.clipLoopScheduler = null;
    return snapshot;
  }

  async updateSampleLoopEvents(
    events: readonly SampleLoopEvent[],
  ): Promise<TransportSnapshot> {
    return this.updateClipLoopEvents({
      noteEvents: [],
      sampleEvents: events,
    });
  }

  async updateClipLoopEvents({
    noteEvents,
    sampleEvents,
  }: {
    noteEvents: readonly NoteLoopEvent[];
    sampleEvents: readonly SampleLoopEvent[];
  }): Promise<TransportSnapshot> {
    if (!this.clipLoopScheduler) {
      return this.getTransportSnapshot();
    }

    const updateToken = (this.sampleLoopUpdateToken += 1);

    await Promise.all([
      this.loadSamplesForLoopEvents(sampleEvents),
      this.loadSamplesForNoteLoopEvents(noteEvents),
    ]);

    if (updateToken !== this.sampleLoopUpdateToken || !this.clipLoopScheduler) {
      return this.getTransportSnapshot();
    }

    this.clipLoopScheduler.setEvents(
      createClipLoopEvents({ noteEvents, sampleEvents }),
    );
    return this.clipLoopScheduler.getSnapshot();
  }

  private scheduleLoadedSample(
    sampleId: SampleId,
    options: PlaySampleOptions = {},
  ): void {
    const audioContext = this.getOrCreateAudioContext();
    const audioBuffer = this.sampleCache.get(sampleId);

    if (!audioBuffer) {
      throw new Error(`Sample "${sampleId}" must be loaded before scheduling.`);
    }

    const sourceNode = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    sourceNode.buffer = audioBuffer;
    gainNode.gain.value = options.gain ?? DEFAULT_SAMPLE_GAIN;
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    sourceNode.addEventListener(
      "ended",
      () => {
        disconnectAudioNode(sourceNode);
        disconnectAudioNode(gainNode);
      },
      { once: true },
    );
    sourceNode.start(
      Math.max(options.when ?? audioContext.currentTime, audioContext.currentTime),
    );
  }

  private schedulePitchedNote(
    event: NoteLoopEvent,
    {
      tempoBpm,
      when,
    }: {
      tempoBpm: number;
      when: number;
    },
  ): void {
    const instrument = getPitchedInstrument(event.instrumentId);

    if (instrument.kind !== "sample") {
      this.scheduleSynthNote(event, { tempoBpm, when });
      return;
    }

    const sampleZone = getSampleZoneForMidiNote({
      instrument,
      midiNote: event.midiNote,
    });

    if (!sampleZone) {
      this.scheduleSynthNote(event, { tempoBpm, when });
      return;
    }

    this.scheduleSampledPitchedNote(event, {
      sampleId: sampleZone.sampleId,
      loopEndSeconds: sampleZone.loopEndSeconds,
      loopStartSeconds: sampleZone.loopStartSeconds,
      rootMidiNote: sampleZone.rootMidiNote,
      tempoBpm,
      when,
    });
  }

  private scheduleSynthNote(
    event: NoteLoopEvent,
    {
      tempoBpm,
      when,
    }: {
      tempoBpm: number;
      when: number;
    },
  ): void {
    const audioContext = this.getOrCreateAudioContext();
    const sourceNode = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = Math.max(when, audioContext.currentTime);
    const durationSeconds = Math.max(
      ticksToSeconds(event.durationTicks, { tempoBpm }),
      0.01,
    );
    const stopTime = startTime + durationSeconds;
    const attackSeconds = Math.min(0.01, durationSeconds / 4);
    const releaseSeconds = Math.min(0.04, durationSeconds / 3);
    const sustainEndTime = Math.max(
      startTime + attackSeconds,
      stopTime - releaseSeconds,
    );
    const gainValue = DEFAULT_SYNTH_GAIN * (event.gain ?? 1);
    const synthVoice: ActiveNoteVoice = {
      gainNode,
      sourceNode,
    };

    sourceNode.type = "triangle";
    sourceNode.frequency.setValueAtTime(
      midiNoteToFrequency(event.midiNote),
      startTime,
    );

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gainValue, startTime + attackSeconds);
    gainNode.gain.setValueAtTime(gainValue, sustainEndTime);
    gainNode.gain.linearRampToValueAtTime(0, stopTime);

    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    this.activeNoteVoices.add(synthVoice);
    sourceNode.addEventListener(
      "ended",
      () => {
        this.activeNoteVoices.delete(synthVoice);
        disconnectAudioNode(sourceNode);
        disconnectAudioNode(gainNode);
      },
      { once: true },
    );

    sourceNode.start(startTime);
    sourceNode.stop(stopTime);
  }

  private scheduleSampledPitchedNote(
    event: NoteLoopEvent,
    {
      loopEndSeconds,
      loopStartSeconds,
      rootMidiNote,
      sampleId,
      tempoBpm,
      when,
    }: {
      loopEndSeconds?: number;
      loopStartSeconds?: number;
      rootMidiNote: number;
      sampleId: SampleId;
      tempoBpm: number;
      when: number;
    },
  ): void {
    const audioContext = this.getOrCreateAudioContext();
    const audioBuffer = this.sampleCache.get(sampleId);

    if (!audioBuffer) {
      throw new Error(`Sample "${sampleId}" must be loaded before scheduling.`);
    }

    const sourceNode = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const startTime = Math.max(when, audioContext.currentTime);
    const durationSeconds = Math.max(
      ticksToSeconds(event.durationTicks, { tempoBpm }),
      0.01,
    );
    const stopTime = startTime + durationSeconds;
    const attackSeconds = Math.min(0.012, durationSeconds / 4);
    const releaseSeconds = Math.min(0.08, durationSeconds / 3);
    const sustainEndTime = Math.max(
      startTime + attackSeconds,
      stopTime - releaseSeconds,
    );
    const gainValue = DEFAULT_PIANO_GAIN * (event.gain ?? 1);
    const sustainLoopRegion = resolveSustainLoopRegion({
      bufferDurationSeconds: audioBuffer.duration,
      loopEndSeconds,
      loopStartSeconds,
      noteDurationSeconds: durationSeconds,
    });
    const sampleVoice: ActiveNoteVoice = {
      gainNode,
      sourceNode,
    };

    sourceNode.buffer = audioBuffer;
    sourceNode.playbackRate.setValueAtTime(
      midiNoteToPlaybackRate(event.midiNote, rootMidiNote),
      startTime,
    );

    if (sustainLoopRegion) {
      sourceNode.loop = true;
      sourceNode.loopStart = sustainLoopRegion.loopStartSeconds;
      sourceNode.loopEnd = sustainLoopRegion.loopEndSeconds;
    }

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gainValue, startTime + attackSeconds);
    gainNode.gain.setValueAtTime(gainValue, sustainEndTime);
    gainNode.gain.linearRampToValueAtTime(0, stopTime);

    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    this.activeNoteVoices.add(sampleVoice);
    sourceNode.addEventListener(
      "ended",
      () => {
        this.activeNoteVoices.delete(sampleVoice);
        disconnectAudioNode(sourceNode);
        disconnectAudioNode(gainNode);
      },
      { once: true },
    );

    sourceNode.start(startTime);
    sourceNode.stop(stopTime);
  }

  private stopActiveNoteVoices(): void {
    const currentTime = this.audioContext?.currentTime ?? 0;

    for (const noteVoice of this.activeNoteVoices) {
      try {
        noteVoice.sourceNode.stop(currentTime);
      } catch {
        // The source may already have a scheduled stop. Disconnecting below is enough.
      }

      disconnectAudioNode(noteVoice.sourceNode);
      disconnectAudioNode(noteVoice.gainNode);
    }

    this.activeNoteVoices.clear();
  }

  private async loadSamplesForLoopEvents(
    events: readonly SampleLoopEvent[],
  ): Promise<void> {
    await Promise.all(
      Array.from(
        new Set(events.map((event) => event.sampleId)),
        (sampleId) => this.loadSample(sampleId),
      ),
    );
  }

  private async loadSamplesForNoteLoopEvents(
    events: readonly NoteLoopEvent[],
  ): Promise<void> {
    await Promise.all(
      Array.from(
        new Set(events.flatMap((event) => this.getSampleIdsForNoteEvent(event))),
        (sampleId) => this.loadSample(sampleId),
      ),
    );
  }

  private getSampleIdsForNoteEvent(event: NoteLoopEvent): SampleId[] {
    const instrument = getPitchedInstrument(event.instrumentId);

    if (instrument.kind !== "sample") {
      return [];
    }

    const sampleZone = getSampleZoneForMidiNote({
      instrument,
      midiNote: event.midiNote,
    });

    return sampleZone ? [sampleZone.sampleId] : [];
  }

  private async fetchAndDecodeSample(
    sample: BundledSampleMeta,
  ): Promise<AudioBuffer> {
    const audioContext = this.getOrCreateAudioContext();
    const response = await fetch(sample.path);

    if (!response.ok) {
      throw new Error(`Failed to load sample "${sample.id}" from ${sample.path}.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  private getSample(sampleId: SampleId): BundledSampleMeta {
    const sample = this.samplesById.get(sampleId);

    if (!sample) {
      throw new Error(`Unknown bundled sample ID: ${sampleId}`);
    }

    return sample;
  }

  private getOrCreateAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioContextClass = getAudioContextConstructor();
      this.audioContext = new AudioContextClass();
    }

    return this.audioContext;
  }
}

function createClipLoopEvents({
  noteEvents,
  sampleEvents,
}: {
  noteEvents: readonly NoteLoopEvent[];
  sampleEvents: readonly SampleLoopEvent[];
}): ClipLoopEvent[] {
  return [
    ...sampleEvents.map((event) => ({
      ...event,
      kind: "sample" as const,
    })),
    ...noteEvents.map((event) => ({
      ...event,
      kind: "note" as const,
    })),
  ];
}

function midiNoteToFrequency(midiNote: number): number {
  return 440 * 2 ** ((midiNote - 69) / 12);
}

function midiNoteToPlaybackRate(midiNote: number, rootMidiNote: number): number {
  return 2 ** ((midiNote - rootMidiNote) / 12);
}

function disconnectAudioNode(audioNode: AudioNode): void {
  try {
    audioNode.disconnect();
  } catch {
    // Nodes may already be disconnected after stop or suspend.
  }
}

function getAudioContextConstructor(): AudioContextConstructor {
  const audioWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: AudioContextConstructor;
    };
  const AudioContextClass =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  return AudioContextClass;
}
