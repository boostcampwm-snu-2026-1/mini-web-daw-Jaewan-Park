import type { ArrangementTrack, TrackId } from "./arrangement";

export interface TrackMixerState {
  trackId: TrackId;
  volumeDb: number;
  muted: boolean;
  solo: boolean;
}

export interface MasterMixerState {
  volumeDb: number;
}

export const MIXER_MIN_VOLUME_DB = -60;
export const MIXER_MAX_VOLUME_DB = 6;
export const MIXER_DEFAULT_VOLUME_DB = 0;

export function createDefaultTrackMixerState(trackId: TrackId): TrackMixerState {
  return {
    muted: false,
    solo: false,
    trackId,
    volumeDb: MIXER_DEFAULT_VOLUME_DB,
  };
}

export function createDefaultTrackMixerStates(
  tracks: readonly ArrangementTrack[],
): TrackMixerState[] {
  return tracks.map((track) => createDefaultTrackMixerState(track.id));
}

export function createDefaultMasterMixerState(): MasterMixerState {
  return {
    volumeDb: MIXER_DEFAULT_VOLUME_DB,
  };
}

export function getTrackMixerState(
  states: readonly TrackMixerState[],
  trackId: TrackId,
): TrackMixerState {
  return (
    states.find((state) => state.trackId === trackId) ??
    createDefaultTrackMixerState(trackId)
  );
}

export function updateTrackMixerState(
  states: readonly TrackMixerState[],
  trackId: TrackId,
  patch: Partial<Omit<TrackMixerState, "trackId">>,
): TrackMixerState[] {
  const hasExistingState = states.some((state) => state.trackId === trackId);
  const nextStates = hasExistingState
    ? states
    : [...states, createDefaultTrackMixerState(trackId)];

  return nextStates.map((state) =>
    state.trackId === trackId
      ? {
          ...state,
          ...patch,
          trackId,
          volumeDb:
            patch.volumeDb === undefined
              ? state.volumeDb
              : clampMixerVolumeDb(patch.volumeDb),
        }
      : state,
  );
}

export function updateMasterMixerState(
  state: MasterMixerState,
  patch: Partial<MasterMixerState>,
): MasterMixerState {
  return {
    ...state,
    ...patch,
    volumeDb:
      patch.volumeDb === undefined
        ? state.volumeDb
        : clampMixerVolumeDb(patch.volumeDb),
  };
}

export function isTrackMixerAudible({
  allTrackStates,
  trackState,
}: {
  allTrackStates: readonly TrackMixerState[];
  trackState: TrackMixerState;
}): boolean {
  const hasSoloedTrack = allTrackStates.some((state) => state.solo);

  return !trackState.muted && (!hasSoloedTrack || trackState.solo);
}

export function getTrackEffectiveGain({
  allTrackStates,
  trackState,
}: {
  allTrackStates: readonly TrackMixerState[];
  trackState: TrackMixerState;
}): number {
  if (!isTrackMixerAudible({ allTrackStates, trackState })) {
    return 0;
  }

  return decibelsToLinearGain(trackState.volumeDb);
}

export function decibelsToLinearGain(volumeDb: number): number {
  const clampedVolumeDb = clampMixerVolumeDb(volumeDb);

  if (clampedVolumeDb <= MIXER_MIN_VOLUME_DB) {
    return 0;
  }

  return 10 ** (clampedVolumeDb / 20);
}

export function clampMixerVolumeDb(volumeDb: number): number {
  if (!Number.isFinite(volumeDb)) {
    return MIXER_DEFAULT_VOLUME_DB;
  }

  return Math.min(
    MIXER_MAX_VOLUME_DB,
    Math.max(MIXER_MIN_VOLUME_DB, volumeDb),
  );
}
