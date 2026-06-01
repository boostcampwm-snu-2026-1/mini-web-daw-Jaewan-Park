import { BUNDLED_DRUM_SAMPLES } from "./bundled-samples";
import type {
  AudioEngine,
  AudioEngineSnapshot,
  BundledSampleMeta,
  PlaySampleOptions,
  SampleId,
} from "./types";

const DEFAULT_SAMPLE_GAIN = 0.9;

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

  constructor(samples: readonly BundledSampleMeta[]) {
    this.samplesById = new Map(samples.map((sample) => [sample.id, sample]));
  }

  getSnapshot(): AudioEngineSnapshot {
    return {
      contextState: this.audioContext?.state ?? "not-created",
      loadedSampleIds: Array.from(this.sampleCache.keys()),
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
    const audioContext = this.getOrCreateAudioContext();

    await this.resume();

    const audioBuffer = await this.loadSample(sampleId);
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
