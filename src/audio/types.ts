import type { SchedulerSnapshot } from "./lookahead-scheduler";
import type { Tick } from "../utils";

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

export interface SampleLoopEvent {
  id: string;
  sampleId: SampleId;
  startTick: Tick;
  gain?: number;
}

export interface StartSampleLoopOptions {
  events: readonly SampleLoopEvent[];
  loopEndTick?: Tick;
  loopStartTick?: Tick;
  lookaheadMs?: number;
  ppq?: number;
  scheduleAheadTime?: number;
  tempoBpm: number;
}

export type TransportSnapshot = SchedulerSnapshot;

export interface AudioEngineSnapshot {
  contextState: AudioContextState | "not-created";
  loadedSampleIds: SampleId[];
  transport: TransportSnapshot;
}

export interface AudioEngine {
  getSnapshot(): AudioEngineSnapshot;
  getTransportSnapshot(): TransportSnapshot;
  resume(): Promise<AudioEngineSnapshot>;
  suspend(): Promise<AudioEngineSnapshot>;
  loadSample(sampleId: SampleId): Promise<AudioBuffer>;
  loadAllSamples(): Promise<AudioEngineSnapshot>;
  playSample(sampleId: SampleId, options?: PlaySampleOptions): Promise<void>;
  startSampleLoop(options: StartSampleLoopOptions): Promise<TransportSnapshot>;
  stopLoop(): TransportSnapshot;
  updateSampleLoopEvents(
    events: readonly SampleLoopEvent[],
  ): Promise<TransportSnapshot>;
}
