export type Tick = number;

export const DEFAULT_PPQ = 480;
export const TICKS_PER_BEAT = DEFAULT_PPQ;
export const TICKS_PER_4_4_BAR = TICKS_PER_BEAT * 4;
export const TICKS_PER_16_STEP = TICKS_PER_4_4_BAR / 16;

interface TickConversionOptions {
  tempoBpm: number;
  ppq?: number;
}

interface TickToAudioTimeOptions extends TickConversionOptions {
  audioStartTime: number;
  startTick?: Tick;
  tick: Tick;
}

interface AudioTimeToTickOptions extends TickConversionOptions {
  audioStartTime: number;
  audioTime: number;
  startTick?: Tick;
}

export function getSecondsPerTick({
  tempoBpm,
  ppq = DEFAULT_PPQ,
}: TickConversionOptions): number {
  validateTempoBpm(tempoBpm);
  validatePpq(ppq);

  return 60 / tempoBpm / ppq;
}

export function ticksToSeconds(
  ticks: Tick,
  options: TickConversionOptions,
): number {
  return ticks * getSecondsPerTick(options);
}

export function secondsToTicks(
  seconds: number,
  options: TickConversionOptions,
): Tick {
  return seconds / getSecondsPerTick(options);
}

export function tickToAudioTime({
  audioStartTime,
  startTick = 0,
  tick,
  tempoBpm,
  ppq = DEFAULT_PPQ,
}: TickToAudioTimeOptions): number {
  return audioStartTime + ticksToSeconds(tick - startTick, { tempoBpm, ppq });
}

export function audioTimeToTick({
  audioStartTime,
  audioTime,
  startTick = 0,
  tempoBpm,
  ppq = DEFAULT_PPQ,
}: AudioTimeToTickOptions): Tick {
  return startTick + secondsToTicks(audioTime - audioStartTime, { tempoBpm, ppq });
}

function validateTempoBpm(tempoBpm: number): void {
  if (!Number.isFinite(tempoBpm) || tempoBpm <= 0) {
    throw new Error(`tempoBpm must be a positive finite number. Received ${tempoBpm}.`);
  }
}

function validatePpq(ppq: number): void {
  if (!Number.isFinite(ppq) || ppq <= 0) {
    throw new Error(`ppq must be a positive finite number. Received ${ppq}.`);
  }
}
