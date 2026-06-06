import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useRef,
  useState,
} from "react";

import { Panel } from "../../components";
import {
  PIANO_ROLL_COLUMN_COUNT,
  PIANO_ROLL_PITCHES,
  TICKS_PER_PIANO_ROLL_COLUMN,
  getPianoRollPitchByMidiNote,
  type NoteEvent,
  type PitchedInstrumentId,
  type PitchedInstrumentMeta,
} from "../../model";
import { type Tick } from "../../utils";
import { PianoKeyboard } from "./PianoKeyboard";
import styles from "./PianoRoll.module.css";

interface PianoRollProps {
  clipLengthTicks: Tick;
  instrumentName: string;
  noteEvents: readonly NoteEvent[];
  playheadTick: Tick;
  pitchedInstruments: readonly PitchedInstrumentMeta[];
  selectedPitchedInstrumentId: PitchedInstrumentId;
  shouldShowPlayhead: boolean;
  onNoteCreate: (note: {
    durationTicks: Tick;
    midiNote: number;
    startTick: Tick;
  }) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteMove: (note: {
    midiNote: number;
    noteId: string;
    startTick: Tick;
  }) => void;
  onPitchedInstrumentChange: (instrumentId: PitchedInstrumentId) => void;
}

interface GridPosition {
  columnIndex: number;
  rowIndex: number;
}

interface DraftNote {
  anchorColumnIndex: number;
  currentColumnIndex: number;
  pointerId: number;
  rowIndex: number;
}

interface MovingNote {
  columnOffset: number;
  currentColumnIndex: number;
  currentRowIndex: number;
  durationColumns: number;
  noteId: string;
  pointerId: number;
}

interface NoteGeometry {
  columnIndex: number;
  durationColumns: number;
  rowIndex: number;
}

const pianoRows = PIANO_ROLL_PITCHES.map((pitch) => ({
  id: `midi-${pitch.midiNote}`,
  keyType: pitch.keyType,
  label: pitch.label,
}));

const beatMarkers = [
  { id: "beat-1", label: "1", className: styles.beatMarkerOne },
  { id: "beat-2", label: "2", className: styles.beatMarkerTwo },
  { id: "beat-3", label: "3", className: styles.beatMarkerThree },
  { id: "beat-4", label: "4", className: styles.beatMarkerFour },
];

export function PianoRoll({
  clipLengthTicks,
  instrumentName,
  noteEvents,
  playheadTick,
  pitchedInstruments,
  selectedPitchedInstrumentId,
  shouldShowPlayhead,
  onNoteCreate,
  onNoteDelete,
  onNoteMove,
  onPitchedInstrumentChange,
}: PianoRollProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draftNote, setDraftNote] = useState<DraftNote | null>(null);
  const [movingNote, setMovingNote] = useState<MovingNote | null>(null);
  const [gridScrollTop, setGridScrollTop] = useState(0);

  function handleGridPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const gridPosition = getGridPosition(event);

    if (!gridPosition) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftNote({
      anchorColumnIndex: gridPosition.columnIndex,
      currentColumnIndex: gridPosition.columnIndex,
      pointerId: event.pointerId,
      rowIndex: gridPosition.rowIndex,
    });
  }

  function handleGridPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draftNote || draftNote.pointerId !== event.pointerId) {
      return;
    }

    const gridPosition = getGridPosition(event);

    if (!gridPosition) {
      return;
    }

    setDraftNote({
      ...draftNote,
      currentColumnIndex: gridPosition.columnIndex,
    });
  }

  function handleGridPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!draftNote || draftNote.pointerId !== event.pointerId) {
      return;
    }

    const draftGeometry = getDraftNoteGeometry(draftNote);
    const pitch = PIANO_ROLL_PITCHES[draftGeometry.rowIndex];

    if (pitch) {
      onNoteCreate({
        durationTicks:
          draftGeometry.durationColumns * TICKS_PER_PIANO_ROLL_COLUMN,
        midiNote: pitch.midiNote,
        startTick: draftGeometry.columnIndex * TICKS_PER_PIANO_ROLL_COLUMN,
      });
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setDraftNote(null);
  }

  function handleGridPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (draftNote?.pointerId === event.pointerId) {
      setDraftNote(null);
    }
  }

  function handleNotePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    note: NoteEvent,
  ) {
    if (event.button !== 0) {
      return;
    }

    const gridPosition = getGridPosition(event);
    const noteGeometry = getNoteGeometry(note);

    if (!gridPosition || !noteGeometry) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setMovingNote({
      columnOffset: Math.max(
        gridPosition.columnIndex - noteGeometry.columnIndex,
        0,
      ),
      currentColumnIndex: noteGeometry.columnIndex,
      currentRowIndex: noteGeometry.rowIndex,
      durationColumns: noteGeometry.durationColumns,
      noteId: note.id,
      pointerId: event.pointerId,
    });
  }

  function handleNotePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!movingNote || movingNote.pointerId !== event.pointerId) {
      return;
    }

    const gridPosition = getGridPosition(event);

    if (!gridPosition) {
      return;
    }

    const maxColumnIndex = PIANO_ROLL_COLUMN_COUNT - movingNote.durationColumns;
    setMovingNote({
      ...movingNote,
      currentColumnIndex: clamp(
        gridPosition.columnIndex - movingNote.columnOffset,
        0,
        maxColumnIndex,
      ),
      currentRowIndex: gridPosition.rowIndex,
    });
  }

  function handleNotePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!movingNote || movingNote.pointerId !== event.pointerId) {
      return;
    }

    const pitch = PIANO_ROLL_PITCHES[movingNote.currentRowIndex];

    if (pitch) {
      onNoteMove({
        midiNote: pitch.midiNote,
        noteId: movingNote.noteId,
        startTick:
          movingNote.currentColumnIndex * TICKS_PER_PIANO_ROLL_COLUMN,
      });
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setMovingNote(null);
  }

  function handleNotePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (movingNote?.pointerId === event.pointerId) {
      setMovingNote(null);
    }
  }

  function handleNoteContextMenu(
    event: MouseEvent<HTMLButtonElement>,
    noteId: string,
  ) {
    event.preventDefault();
    onNoteDelete(noteId);
  }

  function getGridPosition(
    event: PointerEvent<HTMLElement>,
  ): GridPosition | null {
    const gridElement = gridRef.current;

    if (!gridElement) {
      return null;
    }

    const rect = gridElement.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width - 1);
    const y = clamp(event.clientY - rect.top, 0, rect.height - 1);
    const rowHeight = rect.height / PIANO_ROLL_PITCHES.length;

    return {
      columnIndex: clamp(
        Math.floor((x / rect.width) * PIANO_ROLL_COLUMN_COUNT),
        0,
        PIANO_ROLL_COLUMN_COUNT - 1,
      ),
      rowIndex: clamp(
        Math.floor(y / rowHeight),
        0,
        PIANO_ROLL_PITCHES.length - 1,
      ),
    };
  }

  const gridHeight = `calc(var(--piano-row-height) * ${PIANO_ROLL_PITCHES.length})`;
  const movingNoteId = movingNote?.noteId ?? null;

  return (
    <Panel
      actions={
        <div className={styles.rollActions}>
          <div
            aria-label="Pitched instrument"
            className={styles.instrumentSelector}
            role="group"
          >
            {pitchedInstruments.map((instrument) => (
              <button
                aria-pressed={selectedPitchedInstrumentId === instrument.id}
                className={`${styles.instrumentButton} ${
                  selectedPitchedInstrumentId === instrument.id
                    ? styles.instrumentButtonActive
                    : ""
                }`}
                key={instrument.id}
                onClick={() => onPitchedInstrumentChange(instrument.id)}
                type="button"
              >
                {instrument.name}
              </button>
            ))}
          </div>
          <span>Grid: 1/32</span>
          <span>Tool: Draw</span>
        </div>
      }
      className={styles.pianoRollPanel}
      eyebrow="PIANO ROLL"
      title={instrumentName}
    >
      <div className={styles.rollShell}>
        <div className={styles.editorBody}>
          <PianoKeyboard rows={pianoRows} scrollTop={gridScrollTop} />

          <div
            className={styles.gridViewport}
            onScroll={(event) => setGridScrollTop(event.currentTarget.scrollTop)}
          >
            <div className={styles.beatHeader} aria-hidden="true">
              {beatMarkers.map((marker) => (
                <span
                  className={`${styles.beatMarker} ${marker.className}`}
                  key={marker.id}
                >
                  {marker.label}
                </span>
              ))}
            </div>

            <div
              className={styles.noteGrid}
              aria-label="Piano roll note grid"
              onContextMenu={(event) => event.preventDefault()}
              onPointerCancel={handleGridPointerCancel}
              onPointerDown={handleGridPointerDown}
              onPointerMove={handleGridPointerMove}
              onPointerUp={handleGridPointerUp}
              ref={gridRef}
              style={{ height: gridHeight }}
            >
              {noteEvents.map((note) => {
                const noteGeometry =
                  note.id === movingNoteId && movingNote
                    ? {
                        columnIndex: movingNote.currentColumnIndex,
                        durationColumns: movingNote.durationColumns,
                        rowIndex: movingNote.currentRowIndex,
                      }
                    : getNoteGeometry(note);

                if (!noteGeometry) {
                  return null;
                }

                const pitch = getPianoRollPitchByMidiNote(note.midiNote);
                const noteLabel = pitch?.label ?? `MIDI ${note.midiNote}`;

                return (
                  <button
                    aria-label={`${noteLabel} note at tick ${note.startTick}`}
                    className={`${styles.note} ${
                      note.id === movingNoteId ? styles.noteActive : ""
                    }`}
                    key={note.id}
                    onContextMenu={(event) => handleNoteContextMenu(event, note.id)}
                    onPointerCancel={handleNotePointerCancel}
                    onPointerDown={(event) => handleNotePointerDown(event, note)}
                    onPointerMove={handleNotePointerMove}
                    onPointerUp={handleNotePointerUp}
                    style={getNoteStyle(noteGeometry)}
                    type="button"
                  >
                    {noteLabel}
                  </button>
                );
              })}

              {draftNote ? (
                <div
                  className={`${styles.note} ${styles.noteDraft}`}
                  style={getNoteStyle(getDraftNoteGeometry(draftNote))}
                >
                  {PIANO_ROLL_PITCHES[draftNote.rowIndex]?.label}
                </div>
              ) : null}

              {shouldShowPlayhead ? (
                <div
                  aria-hidden="true"
                  className={styles.playhead}
                  style={getPlayheadStyle({ clipLengthTicks, playheadTick })}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function getDraftNoteGeometry(draftNote: DraftNote): NoteGeometry {
  const columnIndex = Math.min(
    draftNote.anchorColumnIndex,
    draftNote.currentColumnIndex,
  );
  const durationColumns =
    Math.abs(draftNote.currentColumnIndex - draftNote.anchorColumnIndex) + 1;

  return {
    columnIndex,
    durationColumns,
    rowIndex: draftNote.rowIndex,
  };
}

function getNoteGeometry(note: NoteEvent): NoteGeometry | null {
  const rowIndex = PIANO_ROLL_PITCHES.findIndex(
    (pitch) => pitch.midiNote === note.midiNote,
  );

  if (rowIndex < 0) {
    return null;
  }

  return {
    columnIndex: clamp(
      Math.round(note.startTick / TICKS_PER_PIANO_ROLL_COLUMN),
      0,
      PIANO_ROLL_COLUMN_COUNT - 1,
    ),
    durationColumns: clamp(
      Math.round(note.durationTicks / TICKS_PER_PIANO_ROLL_COLUMN),
      1,
      PIANO_ROLL_COLUMN_COUNT,
    ),
    rowIndex,
  };
}

function getNoteStyle({
  columnIndex,
  durationColumns,
  rowIndex,
}: NoteGeometry): CSSProperties {
  return {
    height: "var(--piano-row-height)",
    left: `${(columnIndex / PIANO_ROLL_COLUMN_COUNT) * 100}%`,
    top: `calc(var(--piano-row-height) * ${rowIndex})`,
    width: `${(durationColumns / PIANO_ROLL_COLUMN_COUNT) * 100}%`,
  };
}

function getPlayheadStyle({
  clipLengthTicks,
  playheadTick,
}: {
  clipLengthTicks: Tick;
  playheadTick: Tick;
}): CSSProperties {
  if (clipLengthTicks <= 0) {
    return { left: "0%" };
  }

  const loopTick =
    ((playheadTick % clipLengthTicks) + clipLengthTicks) % clipLengthTicks;

  return {
    left: `${(loopTick / clipLengthTicks) * 100}%`,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
