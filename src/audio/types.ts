export type SampleId = string;

export interface BundledSampleMeta {
  id: SampleId;
  name: string;
  path: string;
}

export interface PlaySampleOptions {
  gain?: number;
  when?: number;
}

export interface AudioEngineSnapshot {
  contextState: AudioContextState | "not-created";
  loadedSampleIds: SampleId[];
}

export interface AudioEngine {
  getSnapshot(): AudioEngineSnapshot;
  resume(): Promise<AudioEngineSnapshot>;
  suspend(): Promise<AudioEngineSnapshot>;
  loadSample(sampleId: SampleId): Promise<AudioBuffer>;
  loadAllSamples(): Promise<AudioEngineSnapshot>;
  playSample(sampleId: SampleId, options?: PlaySampleOptions): Promise<void>;
}
