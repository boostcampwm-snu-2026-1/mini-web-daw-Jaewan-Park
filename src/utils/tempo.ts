export const DEFAULT_TEMPO_BPM = 124;
export const MIN_TEMPO_BPM = 60;
export const MAX_TEMPO_BPM = 180;

export function clampTempoBpm(tempoBpm: number): number {
  if (!Number.isFinite(tempoBpm)) {
    return DEFAULT_TEMPO_BPM;
  }

  return Math.min(Math.max(Math.round(tempoBpm), MIN_TEMPO_BPM), MAX_TEMPO_BPM);
}
