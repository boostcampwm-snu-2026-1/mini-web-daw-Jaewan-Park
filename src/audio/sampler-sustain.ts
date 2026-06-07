import type {
  SamplerEnvelopeMeta,
  SamplerSustainMeta,
  SampleZone,
} from "../model";

const DEFAULT_ATTACK_SECONDS = 0.012;
const DEFAULT_RELEASE_SECONDS = 0.08;
const DEFAULT_MINIMUM_LOOP_DURATION_SECONDS = 0.04;
const MINIMUM_SAMPLE_OFFSET_MARGIN_SECONDS = 0.01;
const MAXIMUM_TRANSPORT_RELEASE_SECONDS = 0.2;

export interface SamplerLoopRegion {
  loopEndSeconds: number;
  loopStartSeconds: number;
}

export interface ResolvedSamplerEnvelope {
  attackSeconds: number;
  releaseSeconds: number;
}

export interface SamplerPlaybackPlan {
  envelope: ResolvedSamplerEnvelope;
  sampleDurationSeconds?: number;
  sampleOffsetSeconds: number;
  sustainLoopRegion: SamplerLoopRegion | null;
}

export interface SamplerVoiceRelease {
  releaseStartTime: number;
  stopTime: number;
}

export function resolveSamplerPlaybackPlan({
  bufferDurationSeconds,
  minimumLoopDurationSeconds = DEFAULT_MINIMUM_LOOP_DURATION_SECONDS,
  noteDurationSeconds,
  playbackRate = 1,
  sampleZone,
}: {
  bufferDurationSeconds: number;
  minimumLoopDurationSeconds?: number;
  noteDurationSeconds: number;
  playbackRate?: number;
  sampleZone: SampleZone;
}): SamplerPlaybackPlan {
  const sampleOffsetSeconds = resolveSampleOffsetSeconds({
    bufferDurationSeconds,
    sampleStartSeconds: sampleZone.sampleStartSeconds,
  });
  const sampleEndSeconds = resolveSampleEndSeconds({
    bufferDurationSeconds,
    sampleEndSeconds: sampleZone.sampleEndSeconds,
    sampleOffsetSeconds,
  });
  const sustainLoopRegion = resolveSamplerLoopRegion({
    bufferDurationSeconds,
    minimumLoopDurationSeconds,
    noteDurationSeconds,
    playbackRate,
    sampleEndSeconds,
    sampleStartSeconds: sampleOffsetSeconds,
    sustain: sampleZone.sustain,
  });
  const sampleDurationSeconds =
    sampleEndSeconds === undefined ? undefined : sampleEndSeconds - sampleOffsetSeconds;

  return {
    envelope: resolveSamplerEnvelope({
      envelope: sampleZone.envelope,
      noteDurationSeconds,
    }),
    sampleDurationSeconds,
    sampleOffsetSeconds,
    sustainLoopRegion,
  };
}

export function resolveSamplerLoopRegion({
  bufferDurationSeconds,
  minimumLoopDurationSeconds = DEFAULT_MINIMUM_LOOP_DURATION_SECONDS,
  noteDurationSeconds,
  playbackRate = 1,
  sampleEndSeconds,
  sampleStartSeconds,
  sustain,
}: {
  bufferDurationSeconds: number;
  minimumLoopDurationSeconds?: number;
  noteDurationSeconds: number;
  playbackRate?: number;
  sampleEndSeconds?: number;
  sampleStartSeconds: number;
  sustain?: SamplerSustainMeta;
}): SamplerLoopRegion | null {
  if (
    sustain?.mode !== "forward-loop" ||
    !isNonNegativeFinite(bufferDurationSeconds) ||
    !isNonNegativeFinite(noteDurationSeconds) ||
    !isNonNegativeFinite(sampleStartSeconds) ||
    !isPositiveFinite(playbackRate) ||
    !isPositiveFinite(minimumLoopDurationSeconds) ||
    bufferDurationSeconds <= minimumLoopDurationSeconds
  ) {
    return null;
  }

  const loopStartSeconds = sustain.loopStartSeconds;
  const loopEndSeconds = sustain.loopEndSeconds;

  if (
    !isNonNegativeFinite(loopStartSeconds) ||
    !isNonNegativeFinite(loopEndSeconds) ||
    loopStartSeconds < sampleStartSeconds ||
    loopEndSeconds > bufferDurationSeconds ||
    loopEndSeconds <= loopStartSeconds ||
    loopEndSeconds - loopStartSeconds < minimumLoopDurationSeconds
  ) {
    return null;
  }

  if (sampleEndSeconds !== undefined && loopEndSeconds > sampleEndSeconds) {
    return null;
  }

  const bufferPositionAtNoteEnd =
    sampleStartSeconds + noteDurationSeconds * playbackRate;

  if (bufferPositionAtNoteEnd <= loopEndSeconds) {
    return null;
  }

  return {
    loopEndSeconds,
    loopStartSeconds,
  };
}

export function resolveSamplerEnvelope({
  envelope,
  noteDurationSeconds,
}: {
  envelope?: SamplerEnvelopeMeta;
  noteDurationSeconds: number;
}): ResolvedSamplerEnvelope {
  const safeDurationSeconds = Math.max(noteDurationSeconds, 0.01);
  const rawAttackSeconds = resolveDurationSeconds(
    envelope?.attackSeconds,
    DEFAULT_ATTACK_SECONDS,
  );
  const rawReleaseSeconds = resolveDurationSeconds(
    envelope?.releaseSeconds,
    DEFAULT_RELEASE_SECONDS,
  );
  const attackSeconds = Math.min(rawAttackSeconds, safeDurationSeconds / 4);
  const releaseSeconds = Math.min(
    rawReleaseSeconds,
    safeDurationSeconds / 2,
    Math.max(safeDurationSeconds - attackSeconds, 0),
  );

  return {
    attackSeconds,
    releaseSeconds,
  };
}

export function resolveSamplerVoiceRelease({
  currentTime,
  releaseSeconds,
}: {
  currentTime: number;
  releaseSeconds: number;
}): SamplerVoiceRelease {
  const releaseStartTime = Number.isFinite(currentTime) ? Math.max(currentTime, 0) : 0;
  const safeReleaseSeconds = Math.min(
    resolveDurationSeconds(releaseSeconds, DEFAULT_RELEASE_SECONDS),
    MAXIMUM_TRANSPORT_RELEASE_SECONDS,
  );

  return {
    releaseStartTime,
    stopTime: releaseStartTime + safeReleaseSeconds,
  };
}

function resolveSampleOffsetSeconds({
  bufferDurationSeconds,
  sampleStartSeconds,
}: {
  bufferDurationSeconds: number;
  sampleStartSeconds?: number;
}): number {
  if (!isNonNegativeFinite(sampleStartSeconds)) {
    return 0;
  }

  if (!isPositiveFinite(bufferDurationSeconds)) {
    return 0;
  }

  return Math.min(
    sampleStartSeconds,
    Math.max(bufferDurationSeconds - MINIMUM_SAMPLE_OFFSET_MARGIN_SECONDS, 0),
  );
}

function resolveSampleEndSeconds({
  bufferDurationSeconds,
  sampleEndSeconds,
  sampleOffsetSeconds,
}: {
  bufferDurationSeconds: number;
  sampleEndSeconds?: number;
  sampleOffsetSeconds: number;
}): number | undefined {
  if (
    !isNonNegativeFinite(sampleEndSeconds) ||
    !isPositiveFinite(bufferDurationSeconds) ||
    sampleEndSeconds <= sampleOffsetSeconds ||
    sampleEndSeconds > bufferDurationSeconds
  ) {
    return undefined;
  }

  return sampleEndSeconds;
}

function resolveDurationSeconds(value: number | undefined, fallback: number): number {
  return isNonNegativeFinite(value) ? value : fallback;
}

function isPositiveFinite(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0;
}
