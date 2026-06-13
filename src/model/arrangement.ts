import type { Tick } from "../utils";
import {
  TICKS_PER_4_4_BAR,
  TICKS_PER_BEAT,
  secondsToTicks,
} from "../utils";
import { isAudioClip, isHybridClip, type Clip } from "./audio-clip";

export type TrackId = string;
export type ClipInstanceId = string;

export interface ArrangementTrack {
  id: TrackId;
  name: string;
}

export interface ClipInstance {
  id: ClipInstanceId;
  clipId: string;
  trackId: TrackId;
  startTick: Tick;
  lengthTicks: Tick;
  sourceOffsetSeconds?: number;
}

export const ARRANGEMENT_TRACK_COUNT = 12;
export const ARRANGEMENT_BAR_COUNT = 16;
export const ARRANGEMENT_SNAP_TICKS = TICKS_PER_BEAT;
export const ARRANGEMENT_VISIBLE_LENGTH_TICKS =
  ARRANGEMENT_BAR_COUNT * TICKS_PER_4_4_BAR;
export const ARRANGEMENT_CLIP_DRAG_TYPE = "application/x-mini-daw-clip-id";
export const ARRANGEMENT_CLIP_INSTANCE_DRAG_TYPE =
  "application/x-mini-daw-clip-instance-id";

export function createDefaultArrangementTracks(
  count = ARRANGEMENT_TRACK_COUNT,
): ArrangementTrack[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `track-${index + 1}`,
    name: `Track ${index + 1}`,
  }));
}

export function createClipInstance({
  clip,
  existingInstanceIds,
  startTick,
  tempoBpm,
  trackId,
}: {
  clip: Clip;
  existingInstanceIds: readonly ClipInstanceId[];
  startTick: Tick;
  tempoBpm: number;
  trackId: TrackId;
}): ClipInstance {
  const snappedStartTick = snapArrangementTick(startTick);
  const lengthTicks = getDefaultClipInstanceLength({ clip, tempoBpm });

  return {
    clipId: clip.id,
    id: createUniqueClipInstanceId({
      clipId: clip.id,
      existingInstanceIds,
      startTick: snappedStartTick,
      trackId,
    }),
    lengthTicks,
    startTick: snappedStartTick,
    trackId,
  };
}

export function moveClipInstance({
  instance,
  startTick,
  trackId,
}: {
  instance: ClipInstance;
  startTick: Tick;
  trackId: TrackId;
}): ClipInstance {
  return {
    ...instance,
    startTick: snapArrangementTick(startTick),
    trackId,
  };
}

export function deleteClipInstance(
  instances: readonly ClipInstance[],
  instanceId: ClipInstanceId,
): ClipInstance[] {
  return instances.filter((instance) => instance.id !== instanceId);
}

export function snapArrangementTick(
  tick: Tick,
  snapTicks = ARRANGEMENT_SNAP_TICKS,
): Tick {
  if (!Number.isFinite(tick)) {
    return 0;
  }

  if (!Number.isFinite(snapTicks) || snapTicks <= 0) {
    throw new Error(`snapTicks must be positive. Received ${snapTicks}.`);
  }

  return Math.max(0, Math.round(tick / snapTicks) * snapTicks);
}

export function getArrangementPlaybackEndTick(
  instances: readonly ClipInstance[],
  minimumEndTick = ARRANGEMENT_VISIBLE_LENGTH_TICKS,
): Tick {
  const lastInstanceEndTick = instances.reduce(
    (highestEndTick, instance) =>
      Math.max(highestEndTick, instance.startTick + instance.lengthTicks),
    0,
  );

  return Math.max(minimumEndTick, ceilTickToSnap(lastInstanceEndTick));
}

function getDefaultClipInstanceLength({
  clip,
  tempoBpm,
}: {
  clip: Clip;
  tempoBpm: number;
}): Tick {
  if (isHybridClip(clip)) {
    return clip.lengthTicks;
  }

  if (isAudioClip(clip)) {
    return Math.max(
      ARRANGEMENT_SNAP_TICKS,
      ceilTickToSnap(secondsToTicks(clip.durationSeconds, { tempoBpm })),
    );
  }

  return TICKS_PER_4_4_BAR;
}

function ceilTickToSnap(tick: Tick, snapTicks = ARRANGEMENT_SNAP_TICKS): Tick {
  if (!Number.isFinite(tick) || tick <= 0) {
    return snapTicks;
  }

  return Math.ceil(tick / snapTicks) * snapTicks;
}

function createUniqueClipInstanceId({
  clipId,
  existingInstanceIds,
  startTick,
  trackId,
}: {
  clipId: string;
  existingInstanceIds: readonly ClipInstanceId[];
  startTick: Tick;
  trackId: TrackId;
}): ClipInstanceId {
  const baseId = `clip-instance-${clipId}-${trackId}-${startTick}`;
  const existingIds = new Set(existingInstanceIds);

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let candidate = `${baseId}-${suffix}`;

  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }

  return candidate;
}
