import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import type { BundledSampleMeta } from "../../audio";
import { Panel } from "../../components";
import {
  DRUM_STEP_COUNT,
  DRUM_STEP_SUBDIVISIONS,
  getDrumStepCount,
  getHybridClipBarCount,
  isDrumSubstepActive,
  type DrumEvent,
  type DrumLaneDefinition,
  type DrumLaneId,
  type DrumStepSubdivision,
} from "../../model";
import { TICKS_PER_16_STEP, type Tick } from "../../utils";
import styles from "./DrumSequencer.module.css";

interface DrumSequencerProps {
  clipLengthTicks: Tick;
  drumEvents: readonly DrumEvent[];
  drumLanes: readonly DrumLaneDefinition[];
  drumStepSubdivision: DrumStepSubdivision;
  playheadTick: Tick;
  samples: readonly BundledSampleMeta[];
  shouldShowPlayhead: boolean;
  onLaneMove: (laneId: DrumLaneId, targetIndex: number) => void;
  onLaneSampleChange: (
    laneId: DrumLaneId,
    sample: BundledSampleMeta,
  ) => void;
  onStepToggle: (
    laneId: DrumLaneId,
    stepIndex: number,
    substepIndex: number,
  ) => void;
  onSubdivisionChange: (subdivision: DrumStepSubdivision) => void;
}

interface SampleMenuPosition {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
}

const SAMPLE_MENU_GAP_PX = 4;
const SAMPLE_MENU_MARGIN_PX = 8;
const SAMPLE_MENU_MAX_HEIGHT_PX = 240;
const SAMPLE_MENU_MIN_HEIGHT_PX = 120;
const SAMPLE_MENU_MIN_WIDTH_PX = 240;

export function DrumSequencer({
  clipLengthTicks,
  drumEvents,
  drumLanes,
  drumStepSubdivision,
  playheadTick,
  samples,
  shouldShowPlayhead,
  onLaneMove,
  onLaneSampleChange,
  onStepToggle,
  onSubdivisionChange,
}: DrumSequencerProps) {
  const [openSampleLaneId, setOpenSampleLaneId] = useState<DrumLaneId | null>(
    null,
  );
  const [sampleMenuPosition, setSampleMenuPosition] =
    useState<SampleMenuPosition | null>(null);
  const [draggingLaneId, setDraggingLaneId] = useState<DrumLaneId | null>(null);
  const sampleButtonRefs = useRef(new Map<DrumLaneId, HTMLButtonElement>());
  const openSampleLane = drumLanes.find((lane) => lane.id === openSampleLaneId);
  const barCount = getHybridClipBarCount(clipLengthTicks);
  const stepCount = getDrumStepCount(clipLengthTicks);
  const playheadStepIndex = shouldShowPlayhead
    ? getPlayheadStepIndex(playheadTick, clipLengthTicks)
    : null;
  const subdivisionStyle = {
    "--drum-step-subdivision": drumStepSubdivision,
  } as CSSProperties;

  useEffect(() => {
    if (!openSampleLaneId) {
      return;
    }

    const laneId = openSampleLaneId;

    function updateMenuPosition() {
      const button = sampleButtonRefs.current.get(laneId);

      if (!button) {
        setSampleMenuPosition(null);
        return;
      }

      setSampleMenuPosition(getSampleMenuPosition(button));
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [openSampleLaneId]);

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    laneId: DrumLaneId,
  ) {
    setDraggingLaneId(laneId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", laneId);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();

    const draggedLaneId = getDraggedLaneId(
      event.dataTransfer.getData("text/plain"),
      drumLanes,
    );

    if (draggedLaneId) {
      onLaneMove(draggedLaneId, targetIndex);
    }

    setDraggingLaneId(null);
  }

  function handleSampleMenuToggle(
    event: MouseEvent<HTMLButtonElement>,
    laneId: DrumLaneId,
  ) {
    if (openSampleLaneId === laneId) {
      closeSampleMenu();
      return;
    }

    setSampleMenuPosition(getSampleMenuPosition(event.currentTarget));
    setOpenSampleLaneId(laneId);
  }

  function closeSampleMenu() {
    setOpenSampleLaneId(null);
    setSampleMenuPosition(null);
  }

  return (
    <>
      <Panel
        actions={
          <div className={styles.panelActions}>
            <span className={styles.stepMeta}>
              {barCount} BAR{barCount === 1 ? "" : "S"} / {stepCount} STEPS /{" "}
              {drumStepSubdivision}X
            </span>
            <div
              className={styles.subdivisionControl}
              role="group"
              aria-label="Drum step subdivision"
            >
              {DRUM_STEP_SUBDIVISIONS.map((subdivision) => (
                <button
                  aria-pressed={drumStepSubdivision === subdivision}
                  className={`${styles.subdivisionButton} ${
                    drumStepSubdivision === subdivision
                      ? styles.subdivisionButtonActive
                      : ""
                  }`}
                  key={subdivision}
                  onClick={() => onSubdivisionChange(subdivision)}
                  type="button"
                >
                  {subdivision}x
                </button>
              ))}
            </div>
          </div>
        }
        className={styles.stepSequencerPanel}
        eyebrow="STEP SEQUENCER"
      >
        <div className={styles.sequencer} style={subdivisionStyle}>
          <div className={styles.beatHeader} aria-hidden="true">
            <span />
            <div className={styles.stepNumbers}>
              {Array.from({ length: stepCount }, (_, stepIndex) => {
                const isGroupStart = stepIndex > 0 && stepIndex % 4 === 0;
                const stepLabel = (stepIndex % DRUM_STEP_COUNT) + 1;

                return (
                  <span
                    className={`${styles.primaryStepCell} ${styles.stepNumber} ${
                      isGroupStart ? styles.stepGroupStart : ""
                    } ${
                      stepIndex === playheadStepIndex
                        ? styles.stepNumberPlayhead
                        : ""
                    }`}
                    key={stepIndex}
                  >
                    {stepLabel}
                  </span>
                );
              })}
            </div>
          </div>

          {drumLanes.map((lane, laneIndex) => (
            <div
              className={`${styles.lane} ${
                draggingLaneId === lane.id ? styles.laneDragging : ""
              }`}
              draggable
              key={lane.id}
              onDragEnd={() => setDraggingLaneId(null)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDragStart={(event) => handleDragStart(event, lane.id)}
              onDrop={(event) => handleDrop(event, laneIndex)}
            >
              <div className={styles.laneControls}>
                <div className={styles.samplePicker}>
                  <button
                    aria-controls={`sample-menu-${lane.id}`}
                    aria-expanded={openSampleLaneId === lane.id}
                    aria-haspopup="listbox"
                    className={styles.laneLabelButton}
                    onClick={(event) => handleSampleMenuToggle(event, lane.id)}
                    ref={(element) => {
                      if (element) {
                        sampleButtonRefs.current.set(lane.id, element);
                      } else {
                        sampleButtonRefs.current.delete(lane.id);
                      }
                    }}
                    type="button"
                  >
                    <span className={styles.laneLabel}>{lane.label}</span>
                  </button>
                </div>
                <div className={styles.knobGroup} aria-hidden="true">
                  <span className={styles.knob} />
                  <span className={styles.knob} />
                </div>
              </div>

              <div className={styles.steps}>
                {Array.from({ length: stepCount }, (_, stepIndex) => {
                  const isAlternateGroup = Math.floor(stepIndex / 4) % 2 === 1;
                  const isGroupStart = stepIndex > 0 && stepIndex % 4 === 0;
                  const isPlayheadStep = stepIndex === playheadStepIndex;
                  const barNumber = Math.floor(stepIndex / DRUM_STEP_COUNT) + 1;
                  const stepLabel = (stepIndex % DRUM_STEP_COUNT) + 1;

                  return (
                    <div
                      className={`${styles.primaryStepCell} ${
                        isAlternateGroup ? styles.primaryStepCellAlternate : ""
                      } ${isGroupStart ? styles.stepGroupStart : ""}`}
                      key={stepIndex}
                    >
                      {Array.from(
                        { length: drumStepSubdivision },
                        (_, substepIndex) => {
                          const isActive = isDrumSubstepActive({
                            clipLengthTicks,
                            drumEvents,
                            laneId: lane.id,
                            stepIndex,
                            subdivision: drumStepSubdivision,
                            substepIndex,
                          });

                          return (
                            <button
                              aria-label={`Toggle ${lane.label} bar ${barNumber} step ${
                                stepLabel
                              } substep ${substepIndex + 1}`}
                              aria-pressed={isActive}
                              className={`${styles.stepButton} ${
                                isActive ? styles.stepButtonActive : ""
                              } ${
                                isPlayheadStep ? styles.stepButtonPlayhead : ""
                              }`}
                              key={substepIndex}
                              onClick={() =>
                                onStepToggle(lane.id, stepIndex, substepIndex)
                              }
                              type="button"
                            />
                          );
                        },
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {openSampleLane && sampleMenuPosition
        ? createPortal(
            <div
              aria-label={`Select sample for ${openSampleLane.label}`}
              className={styles.sampleMenu}
              id={`sample-menu-${openSampleLane.id}`}
              role="listbox"
              style={{
                left: sampleMenuPosition.left,
                maxHeight: sampleMenuPosition.maxHeight,
                top: sampleMenuPosition.top,
                width: sampleMenuPosition.width,
              }}
            >
              {samples.map((sample) => (
                <button
                  aria-selected={sample.id === openSampleLane.sampleId}
                  className={`${styles.sampleOption} ${
                    sample.id === openSampleLane.sampleId
                      ? styles.sampleOptionSelected
                      : ""
                  }`}
                  key={sample.id}
                  onClick={() => {
                    onLaneSampleChange(openSampleLane.id, sample);
                    closeSampleMenu();
                  }}
                  role="option"
                  type="button"
                >
                  {sample.name}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function getDraggedLaneId(
  value: string,
  drumLanes: readonly DrumLaneDefinition[],
): DrumLaneId | null {
  return drumLanes.some((lane) => lane.id === value)
    ? (value as DrumLaneId)
    : null;
}

function getPlayheadStepIndex(
  playheadTick: Tick,
  clipLengthTicks: Tick,
): number {
  const loopTick =
    ((playheadTick % clipLengthTicks) + clipLengthTicks) % clipLengthTicks;

  return Math.min(
    Math.floor(loopTick / TICKS_PER_16_STEP),
    getDrumStepCount(clipLengthTicks) - 1,
  );
}

function getSampleMenuPosition(button: HTMLButtonElement): SampleMenuPosition {
  const rect = button.getBoundingClientRect();
  const width = Math.min(
    Math.max(rect.width, SAMPLE_MENU_MIN_WIDTH_PX),
    window.innerWidth - SAMPLE_MENU_MARGIN_PX * 2,
  );
  const left = Math.min(
    Math.max(SAMPLE_MENU_MARGIN_PX, rect.left),
    window.innerWidth - width - SAMPLE_MENU_MARGIN_PX,
  );
  const belowTop = rect.bottom + SAMPLE_MENU_GAP_PX;
  const belowSpace = window.innerHeight - belowTop - SAMPLE_MENU_MARGIN_PX;
  const aboveSpace = rect.top - SAMPLE_MENU_GAP_PX - SAMPLE_MENU_MARGIN_PX;
  const shouldOpenAbove =
    belowSpace < SAMPLE_MENU_MIN_HEIGHT_PX && aboveSpace > belowSpace;
  const availableHeight = shouldOpenAbove ? aboveSpace : belowSpace;
  const maxHeight = Math.max(
    SAMPLE_MENU_MIN_HEIGHT_PX,
    Math.min(SAMPLE_MENU_MAX_HEIGHT_PX, availableHeight),
  );
  const top = shouldOpenAbove
    ? Math.max(SAMPLE_MENU_MARGIN_PX, rect.top - SAMPLE_MENU_GAP_PX - maxHeight)
    : belowTop;

  return {
    left,
    maxHeight,
    top,
    width,
  };
}
