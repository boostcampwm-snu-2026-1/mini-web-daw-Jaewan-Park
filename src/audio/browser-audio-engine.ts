import { BUNDLED_DRUM_SAMPLES } from "./bundled-samples";
import { LookaheadScheduler } from "./lookahead-scheduler";
import type {
  AudioEngine,
  AudioEngineSnapshot,
  BundledSampleMeta,
  PlaySampleOptions,
  SampleId,
  SampleLoopEvent,
  StartSampleLoopOptions,
  TransportSnapshot,
} from "./types";
import { TICKS_PER_4_4_BAR } from "../utils";

const DEFAULT_SAMPLE_GAIN = 0.9;
const DEFAULT_TRANSPORT_TEMPO_BPM = 120;

type AudioContextConstructor = new () => AudioContext;

export function createAudioEngine(
  samples: readonly BundledSampleMeta[] = BUNDLED_DRUM_SAMPLES,
): AudioEngine {
  return new BrowserAudioEngine(samples);
}

export class BrowserAudioEngine implements AudioEngine {
  private readonly samplesById: Map<SampleId, BundledSampleMeta>;
  private readonly sampleCache = new Map<SampleId, AudioBuffer>();
  private readonly loadingSamples = new Map<SampleId, Promise<AudioBuffer>>();
  private audioContext: AudioContext | null = null;
  private sampleLoopUpdateToken = 0;
  private sampleLoopScheduler: LookaheadScheduler<SampleLoopEvent> | null = null;

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
    if (this.sampleLoopScheduler) {
      return this.sampleLoopScheduler.getSnapshot();
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
    tempoBpm,
  }: StartSampleLoopOptions): Promise<TransportSnapshot> {
    await this.resume();

    await this.loadSamplesForLoopEvents(events);

    this.stopLoop();

    const audioContext = this.getOrCreateAudioContext();
    this.sampleLoopScheduler = new LookaheadScheduler<SampleLoopEvent>({
      events,
      getAudioTime: () => audioContext.currentTime,
      lookaheadMs,
      loopEndTick,
      loopStartTick,
      ppq,
      scheduleAheadTime,
      scheduleEvent: ({ audioTime, event }) => {
        this.scheduleLoadedSample(event.sampleId, {
          gain: event.gain,
          when: audioTime,
        });
      },
      tempoBpm,
    });

    return this.sampleLoopScheduler.start();
  }

  stopLoop(): TransportSnapshot {
    this.sampleLoopUpdateToken += 1;

    if (!this.sampleLoopScheduler) {
      return this.getTransportSnapshot();
    }

    const snapshot = this.sampleLoopScheduler.stop();
    this.sampleLoopScheduler = null;
    return snapshot;
  }

  async updateSampleLoopEvents(
    events: readonly SampleLoopEvent[],
  ): Promise<TransportSnapshot> {
    if (!this.sampleLoopScheduler) {
      return this.getTransportSnapshot();
    }

    const updateToken = (this.sampleLoopUpdateToken += 1);

    await this.loadSamplesForLoopEvents(events);

    if (updateToken !== this.sampleLoopUpdateToken || !this.sampleLoopScheduler) {
      return this.getTransportSnapshot();
    }

    this.sampleLoopScheduler.setEvents(events);
    return this.sampleLoopScheduler.getSnapshot();
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
        sourceNode.disconnect();
        gainNode.disconnect();
      },
      { once: true },
    );
    sourceNode.start(Math.max(options.when ?? audioContext.currentTime, audioContext.currentTime));
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
