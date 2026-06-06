import {
  TICKS_PER_4_4_BAR,
  TICKS_PER_16_STEP,
  type Tick,
} from "../utils";

export type DrumLaneId = "kick" | "snare" | "closedHat" | "openHat";
export type PitchedInstrumentId = "default-synth" | "iowa-piano";

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
  instrumentId: PitchedInstrumentId;
  midiNote: number;
  startTick: Tick;
  durationTicks: Tick;
  velocity: number;
}

export interface PianoRollPitch {
  keyType: "white" | "black";
  label: string;
  midiNote: number;
  sampleId: string;
}

export interface HybridClip {
  id: string;
  name: string;
  lengthTicks: Tick;
  drumLanes: DrumLaneDefinition[];
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
export const DEFAULT_NOTE_VELOCITY = 0.8;
export const DEFAULT_PITCHED_INSTRUMENT_ID: PitchedInstrumentId = "default-synth";
export const DRUM_STEP_COUNT = 16;
export const PIANO_ROLL_COLUMN_COUNT = 32;
export const TICKS_PER_PIANO_ROLL_COLUMN =
  TICKS_PER_4_4_BAR / PIANO_ROLL_COLUMN_COUNT;

export const PIANO_ROLL_PITCHES = [
  {
    keyType: "white",
    label: "C5",
    midiNote: 72,
    sampleId: "iowa-piano-c5",
  },
  {
    keyType: "white",
    label: "B4",
    midiNote: 71,
    sampleId: "iowa-piano-b4",
  },
  {
    keyType: "black",
    label: "Bb4",
    midiNote: 70,
    sampleId: "iowa-piano-bb4",
  },
  {
    keyType: "white",
    label: "A4",
    midiNote: 69,
    sampleId: "iowa-piano-a4",
  },
  {
    keyType: "black",
    label: "Ab4",
    midiNote: 68,
    sampleId: "iowa-piano-ab4",
  },
  {
    keyType: "white",
    label: "G4",
    midiNote: 67,
    sampleId: "iowa-piano-g4",
  },
  {
    keyType: "black",
    label: "Gb4",
    midiNote: 66,
    sampleId: "iowa-piano-gb4",
  },
  {
    keyType: "white",
    label: "F4",
    midiNote: 65,
    sampleId: "iowa-piano-f4",
  },
  {
    keyType: "white",
    label: "E4",
    midiNote: 64,
    sampleId: "iowa-piano-e4",
  },
  {
    keyType: "black",
    label: "Eb4",
    midiNote: 63,
    sampleId: "iowa-piano-eb4",
  },
  {
    keyType: "white",
    label: "D4",
    midiNote: 62,
    sampleId: "iowa-piano-d4",
  },
  {
    keyType: "black",
    label: "Db4",
    midiNote: 61,
    sampleId: "iowa-piano-db4",
  },
  {
    keyType: "white",
    label: "C4",
    midiNote: 60,
    sampleId: "iowa-piano-c4",
  },
] as const satisfies readonly PianoRollPitch[];

export function createEmptyHybridClip({
  id = "clip-1",
  name = "Clip 1",
}: {
  id?: string;
  name?: string;
} = {}): HybridClip {
  return {
    drumEvents: [],
    drumLanes: cloneDrumLanes(DRUM_LANES),
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
  const lane = getDrumLane(clip.drumLanes, laneId);
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

  drumEvents.sort(createDrumEventComparator(clip.drumLanes));

  return {
    ...clip,
    drumEvents,
  };
}

export function updateDrumLaneSample({
  clip,
  label,
  laneId,
  sampleId,
}: {
  clip: HybridClip;
  label: string;
  laneId: DrumLaneId;
  sampleId: string;
}): HybridClip {
  getDrumLane(clip.drumLanes, laneId);

  return {
    ...clip,
    drumEvents: clip.drumEvents.map((event) =>
      event.laneId === laneId
        ? {
            ...event,
            sampleId,
          }
        : event,
    ),
    drumLanes: clip.drumLanes.map((lane) =>
      lane.id === laneId
        ? {
            ...lane,
            label,
            sampleId,
          }
        : lane,
    ),
  };
}

export function moveDrumLane({
  clip,
  laneId,
  targetIndex,
}: {
  clip: HybridClip;
  laneId: DrumLaneId;
  targetIndex: number;
}): HybridClip {
  const currentIndex = clip.drumLanes.findIndex((lane) => lane.id === laneId);

  if (currentIndex < 0) {
    throw new Error(`Unknown drum lane ID: ${laneId}`);
  }

  const nextDrumLanes = [...clip.drumLanes];
  const [movedLane] = nextDrumLanes.splice(currentIndex, 1);

  if (!movedLane) {
    throw new Error(`Unknown drum lane ID: ${laneId}`);
  }

  const boundedTargetIndex = Math.min(
    Math.max(targetIndex, 0),
    nextDrumLanes.length,
  );

  nextDrumLanes.splice(boundedTargetIndex, 0, movedLane);

  return {
    ...clip,
    drumEvents: [...clip.drumEvents].sort(
      createDrumEventComparator(nextDrumLanes),
    ),
    drumLanes: nextDrumLanes,
  };
}

export function getPianoRollColumnStartTick(columnIndex: number): Tick {
  validatePianoRollColumnIndex(columnIndex);

  return columnIndex * TICKS_PER_PIANO_ROLL_COLUMN;
}

export function getPianoRollPitchByMidiNote(
  midiNote: number,
): PianoRollPitch | undefined {
  return PIANO_ROLL_PITCHES.find((pitch) => pitch.midiNote === midiNote);
}

export function addNoteEvent({
  clip,
  durationTicks,
  instrumentId = DEFAULT_PITCHED_INSTRUMENT_ID,
  midiNote,
  startTick,
  velocity = DEFAULT_NOTE_VELOCITY,
}: {
  clip: HybridClip;
  durationTicks: Tick;
  instrumentId?: PitchedInstrumentId;
  midiNote: number;
  startTick: Tick;
  velocity?: number;
}): HybridClip {
  validateMidiNote(midiNote);
  validateVelocity(velocity);

  const nextTiming = normalizeNoteTiming({
    durationTicks,
    lengthTicks: clip.lengthTicks,
    startTick,
  });
  const nextNote: NoteEvent = {
    durationTicks: nextTiming.durationTicks,
    id: createNoteEventId(clip.id, instrumentId, midiNote, nextTiming.startTick),
    instrumentId,
    midiNote,
    startTick: nextTiming.startTick,
    velocity,
  };
  const noteEvents = [
    ...clip.noteEvents.filter(
      (event) =>
        !(
          event.instrumentId === nextNote.instrumentId &&
          event.midiNote === nextNote.midiNote &&
          event.startTick === nextNote.startTick
        ),
    ),
    nextNote,
  ];

  noteEvents.sort(createNoteEventComparator);

  return {
    ...clip,
    noteEvents,
  };
}

export function deleteNoteEvent({
  clip,
  noteId,
}: {
  clip: HybridClip;
  noteId: string;
}): HybridClip {
  return {
    ...clip,
    noteEvents: clip.noteEvents.filter((event) => event.id !== noteId),
  };
}

export function moveNoteEvent({
  clip,
  midiNote,
  noteId,
  startTick,
}: {
  clip: HybridClip;
  midiNote: number;
  noteId: string;
  startTick: Tick;
}): HybridClip {
  validateMidiNote(midiNote);

  const note = clip.noteEvents.find((event) => event.id === noteId);

  if (!note) {
    return clip;
  }

  const nextTiming = normalizeNoteTiming({
    durationTicks: note.durationTicks,
    lengthTicks: clip.lengthTicks,
    startTick,
  });
  const movedNote: NoteEvent = {
    ...note,
    midiNote,
    startTick: nextTiming.startTick,
  };
  const noteEvents = [
    ...clip.noteEvents.filter(
      (event) =>
        event.id !== noteId &&
        !(
          event.instrumentId === movedNote.instrumentId &&
          event.midiNote === movedNote.midiNote &&
          event.startTick === movedNote.startTick
        ),
    ),
    movedNote,
  ];

  noteEvents.sort(createNoteEventComparator);

  return {
    ...clip,
    noteEvents,
  };
}

export function resizeNoteEvent({
  clip,
  durationTicks,
  noteId,
}: {
  clip: HybridClip;
  durationTicks: Tick;
  noteId: string;
}): HybridClip {
  const note = clip.noteEvents.find((event) => event.id === noteId);

  if (!note) {
    return clip;
  }

  const nextTiming = normalizeNoteTiming({
    durationTicks,
    lengthTicks: clip.lengthTicks,
    startTick: note.startTick,
  });

  return {
    ...clip,
    noteEvents: clip.noteEvents.map((event) =>
      event.id === noteId
        ? {
            ...event,
            durationTicks: nextTiming.durationTicks,
          }
        : event,
    ),
  };
}

function getDrumLane(
  drumLanes: readonly DrumLaneDefinition[],
  laneId: DrumLaneId,
): DrumLaneDefinition {
  const lane = drumLanes.find((candidate) => candidate.id === laneId);

  if (!lane) {
    throw new Error(`Unknown drum lane ID: ${laneId}`);
  }

  return lane;
}

function createDrumEventComparator(
  drumLanes: readonly DrumLaneDefinition[],
): (left: DrumEvent, right: DrumEvent) => number {
  const drumLaneOrder = new Map<DrumLaneId, number>(
    drumLanes.map((lane, index) => [lane.id, index]),
  );

  return (left, right) => {
    if (left.startTick !== right.startTick) {
      return left.startTick - right.startTick;
    }

    return (
      getLaneOrder(drumLaneOrder, left.laneId) -
      getLaneOrder(drumLaneOrder, right.laneId)
    );
  };
}

function getLaneOrder(
  drumLaneOrder: ReadonlyMap<DrumLaneId, number>,
  laneId: DrumLaneId,
): number {
  return drumLaneOrder.get(laneId) ?? Number.MAX_SAFE_INTEGER;
}

function createDrumEventId(
  clipId: string,
  laneId: DrumLaneId,
  startTick: Tick,
): string {
  return `${clipId}:drum:${laneId}:${startTick}`;
}

function createNoteEventId(
  clipId: string,
  instrumentId: PitchedInstrumentId,
  midiNote: number,
  startTick: Tick,
): string {
  return `${clipId}:note:${instrumentId}:${midiNote}:${startTick}`;
}

function createNoteEventComparator(left: NoteEvent, right: NoteEvent): number {
  if (left.startTick !== right.startTick) {
    return left.startTick - right.startTick;
  }

  if (left.instrumentId !== right.instrumentId) {
    return left.instrumentId.localeCompare(right.instrumentId);
  }

  return right.midiNote - left.midiNote;
}

function validateStepIndex(stepIndex: number): void {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= DRUM_STEP_COUNT) {
    throw new Error(
      `stepIndex must be an integer from 0 to ${DRUM_STEP_COUNT - 1}. Received ${stepIndex}.`,
    );
  }
}

function validatePianoRollColumnIndex(columnIndex: number): void {
  if (
    !Number.isInteger(columnIndex) ||
    columnIndex < 0 ||
    columnIndex >= PIANO_ROLL_COLUMN_COUNT
  ) {
    throw new Error(
      `columnIndex must be an integer from 0 to ${PIANO_ROLL_COLUMN_COUNT - 1}. Received ${columnIndex}.`,
    );
  }
}

function validateMidiNote(midiNote: number): void {
  if (!Number.isInteger(midiNote) || midiNote < 0 || midiNote > 127) {
    throw new Error(`midiNote must be an integer from 0 to 127. Received ${midiNote}.`);
  }
}

function validateVelocity(velocity: number): void {
  if (!Number.isFinite(velocity) || velocity < 0 || velocity > 1) {
    throw new Error(`velocity must be a number from 0 to 1. Received ${velocity}.`);
  }
}

function normalizeNoteTiming({
  durationTicks,
  lengthTicks,
  startTick,
}: {
  durationTicks: Tick;
  lengthTicks: Tick;
  startTick: Tick;
}): { durationTicks: Tick; startTick: Tick } {
  if (!Number.isFinite(startTick)) {
    throw new Error(`startTick must be finite. Received ${startTick}.`);
  }

  if (!Number.isFinite(durationTicks) || durationTicks <= 0) {
    throw new Error(
      `durationTicks must be a positive finite number. Received ${durationTicks}.`,
    );
  }

  const boundedStartTick = Math.min(
    Math.max(startTick, 0),
    lengthTicks - TICKS_PER_PIANO_ROLL_COLUMN,
  );
  const boundedDurationTicks = Math.min(
    durationTicks,
    lengthTicks - boundedStartTick,
  );

  return {
    durationTicks: boundedDurationTicks,
    startTick: boundedStartTick,
  };
}

function cloneDrumLanes(
  drumLanes: readonly DrumLaneDefinition[],
): DrumLaneDefinition[] {
  return drumLanes.map((lane) => ({ ...lane }));
}
