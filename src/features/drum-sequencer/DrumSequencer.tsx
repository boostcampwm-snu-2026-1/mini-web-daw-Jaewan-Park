import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import type { BundledSampleMeta } from "../../audio";
import { Panel } from "../../components";
import {
  DRUM_STEP_COUNT,
  isDrumStepActive,
  type DrumEvent,
  type DrumLaneDefinition,
  type DrumLaneId,
} from "../../model";
import { TICKS_PER_16_STEP, TICKS_PER_4_4_BAR, type Tick } from "../../utils";
import styles from "./DrumSequencer.module.css";

interface DrumSequencerProps {
  drumEvents: readonly DrumEvent[];
  drumLanes: readonly DrumLaneDefinition[];
  playheadTick: Tick;
  samples: readonly BundledSampleMeta[];
  onLaneMove: (laneId: DrumLaneId, targetIndex: number) => void;
  onLaneSampleChange: (
    laneId: DrumLaneId,
    sample: BundledSampleMeta,
  ) => void;
  onStepToggle: (laneId: DrumLaneId, stepIndex: number) => void;
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
  drumEvents,
  drumLanes,
  playheadTick,
  samples,
  onLaneMove,
  onLaneSampleChange,
  onStepToggle,
}: DrumSequencerProps) {
  const [openSampleLaneId, setOpenSampleLaneId] = useState<DrumLaneId | null>(
    null,
  );
  const [sampleMenuPosition, setSampleMenuPosition] =
    useState<SampleMenuPosition | null>(null);
  const [draggingLaneId, setDraggingLaneId] = useState<DrumLaneId | null>(null);
  const sampleButtonRefs = useRef(new Map<DrumLaneId, HTMLButtonElement>());
  const openSampleLane = drumLanes.find((lane) => lane.id === openSampleLaneId);
  const playheadStepIndex = getPlayheadStepIndex(playheadTick);

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
        actions={<span className={styles.stepMeta}>1 BAR / 16 STEPS</span>}
        className={styles.stepSequencerPanel}
        eyebrow="STEP SEQUENCER"
      >
        <div className={styles.sequencer}>
          <div className={styles.beatHeader} aria-hidden="true">
            <span />
            <div className={styles.stepNumbers}>
              {Array.from({ length: DRUM_STEP_COUNT }, (_, stepIndex) => {
                const isGroupStart = stepIndex > 0 && stepIndex % 4 === 0;

                return (
                  <span
                    className={`${styles.stepNumber} ${
                      isGroupStart ? styles.stepGroupStart : ""
                    } ${
                      stepIndex === playheadStepIndex
                        ? styles.stepNumberPlayhead
                        : ""
                    }`}
                    key={stepIndex}
                  >
                    {stepIndex + 1}
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
                {Array.from({ length: DRUM_STEP_COUNT }, (_, stepIndex) => {
                  const isActive = isDrumStepActive(
                    drumEvents,
                    lane.id,
                    stepIndex,
                  );
                  const isAlternateGroup = Math.floor(stepIndex / 4) % 2 === 1;
                  const isGroupStart = stepIndex > 0 && stepIndex % 4 === 0;
                  const isPlayheadStep = stepIndex === playheadStepIndex;

                  return (
                    <button
                      aria-label={`Toggle ${lane.label} step ${stepIndex + 1}`}
                      aria-pressed={isActive}
                      className={`${styles.stepButton} ${
                        isAlternateGroup ? styles.stepButtonAlternate : ""
                      } ${
                        isGroupStart ? styles.stepGroupStart : ""
                      } ${
                        isActive ? styles.stepButtonActive : ""
                      } ${
                        isPlayheadStep ? styles.stepButtonPlayhead : ""
                      }`}
                      key={stepIndex}
                      onClick={() => onStepToggle(lane.id, stepIndex)}
                      type="button"
                    />
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

function getPlayheadStepIndex(playheadTick: Tick): number {
  const loopTick =
    ((playheadTick % TICKS_PER_4_4_BAR) + TICKS_PER_4_4_BAR) %
    TICKS_PER_4_4_BAR;

  return Math.min(
    Math.floor(loopTick / TICKS_PER_16_STEP),
    DRUM_STEP_COUNT - 1,
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
