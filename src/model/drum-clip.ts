import {
  TICKS_PER_4_4_BAR,
  TICKS_PER_16_STEP,
  type Tick,
} from "../utils";

export type DrumLaneId = "kick" | "snare" | "closedHat" | "openHat";

export interface DrumLaneDefinition {
  id: DrumLaneId;
  label: string;
  sampleId: string;
}

export interface DrumEvent {
  id: string;
  laneId: DrumLaneId;
  sampleId: string;
  startTick: Tick;
  velocity: number;
}

export interface NoteEvent {
  id: string;
  midiNote: number;
  startTick: Tick;
  durationTicks: Tick;
  velocity: number;
}

export interface HybridClip {
  id: string;
  name: string;
  lengthTicks: Tick;
  drumEvents: DrumEvent[];
  noteEvents: NoteEvent[];
}

export const DRUM_LANES = [
  { id: "kick", label: "FRED KICK 1", sampleId: "fred-kick-1" },
  { id: "snare", label: "FRED SNARE 1", sampleId: "fred-snare-1" },
  {
    id: "closedHat",
    label: "FRED CLOSED HI-HAT",
    sampleId: "fred-closed-hi-hat",
  },
  {
    id: "openHat",
    label: "FRED OPEN HI-HAT",
    sampleId: "fred-open-hi-hat",
  },
] as const satisfies readonly DrumLaneDefinition[];

export const DEFAULT_DRUM_VELOCITY = 1;
export const DRUM_STEP_COUNT = 16;

const drumLaneOrder = new Map<DrumLaneId, number>(
  DRUM_LANES.map((lane, index) => [lane.id, index]),
);

export function createEmptyHybridClip({
  id = "clip-1",
  name = "Clip 1",
}: {
  id?: string;
  name?: string;
} = {}): HybridClip {
  return {
    drumEvents: [],
    id,
    lengthTicks: TICKS_PER_4_4_BAR,
    name,
    noteEvents: [],
  };
}

export function getDrumStepStartTick(stepIndex: number): Tick {
  validateStepIndex(stepIndex);

  return stepIndex * TICKS_PER_16_STEP;
}

export function isDrumStepActive(
  drumEvents: readonly DrumEvent[],
  laneId: DrumLaneId,
  stepIndex: number,
): boolean {
  const startTick = getDrumStepStartTick(stepIndex);

  return drumEvents.some(
    (event) => event.laneId === laneId && event.startTick === startTick,
  );
}

export function toggleDrumStep({
  clip,
  laneId,
  stepIndex,
  velocity = DEFAULT_DRUM_VELOCITY,
}: {
  clip: HybridClip;
  laneId: DrumLaneId;
  stepIndex: number;
  velocity?: number;
}): HybridClip {
  const lane = getDrumLane(laneId);
  const startTick = getDrumStepStartTick(stepIndex);
  const eventExists = isDrumStepActive(clip.drumEvents, laneId, stepIndex);

  if (eventExists) {
    return {
      ...clip,
      drumEvents: clip.drumEvents.filter(
        (event) => !(event.laneId === laneId && event.startTick === startTick),
      ),
    };
  }

  const drumEvents = [
    ...clip.drumEvents,
    {
      id: createDrumEventId(clip.id, laneId, startTick),
      laneId,
      sampleId: lane.sampleId,
      startTick,
      velocity,
    },
  ];

  drumEvents.sort(compareDrumEvents);

  return {
    ...clip,
    drumEvents,
  };
}

function getDrumLane(laneId: DrumLaneId): DrumLaneDefinition {
  const lane = DRUM_LANES.find((candidate) => candidate.id === laneId);

  if (!lane) {
    throw new Error(`Unknown drum lane ID: ${laneId}`);
  }

  return lane;
}

function compareDrumEvents(left: DrumEvent, right: DrumEvent): number {
  if (left.startTick !== right.startTick) {
    return left.startTick - right.startTick;
  }

  return getLaneOrder(left.laneId) - getLaneOrder(right.laneId);
}

function getLaneOrder(laneId: DrumLaneId): number {
  return drumLaneOrder.get(laneId) ?? Number.MAX_SAFE_INTEGER;
}

function createDrumEventId(
  clipId: string,
  laneId: DrumLaneId,
  startTick: Tick,
): string {
  return `${clipId}:drum:${laneId}:${startTick}`;
}

function validateStepIndex(stepIndex: number): void {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= DRUM_STEP_COUNT) {
    throw new Error(
      `stepIndex must be an integer from 0 to ${DRUM_STEP_COUNT - 1}. Received ${stepIndex}.`,
    );
  }
}
