import { useState, type DragEvent } from "react";

import type { BundledSampleMeta } from "../../audio";
import { Panel } from "../../components";
import {
  DRUM_STEP_COUNT,
  isDrumStepActive,
  type DrumEvent,
  type DrumLaneDefinition,
  type DrumLaneId,
} from "../../model";
import styles from "./DrumSequencer.module.css";

interface DrumSequencerProps {
  drumEvents: readonly DrumEvent[];
  drumLanes: readonly DrumLaneDefinition[];
  samples: readonly BundledSampleMeta[];
  onLaneMove: (laneId: DrumLaneId, targetIndex: number) => void;
  onLaneSampleChange: (
    laneId: DrumLaneId,
    sample: BundledSampleMeta,
  ) => void;
  onStepToggle: (laneId: DrumLaneId, stepIndex: number) => void;
}

export function DrumSequencer({
  drumEvents,
  drumLanes,
  samples,
  onLaneMove,
  onLaneSampleChange,
  onStepToggle,
}: DrumSequencerProps) {
  const [openSampleLaneId, setOpenSampleLaneId] = useState<DrumLaneId | null>(
    null,
  );
  const [draggingLaneId, setDraggingLaneId] = useState<DrumLaneId | null>(null);

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

  return (
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
                  onClick={() =>
                    setOpenSampleLaneId((currentLaneId) =>
                      currentLaneId === lane.id ? null : lane.id,
                    )
                  }
                  type="button"
                >
                  <span className={styles.laneLabel}>{lane.label}</span>
                </button>

                {openSampleLaneId === lane.id ? (
                  <div
                    className={styles.sampleMenu}
                    id={`sample-menu-${lane.id}`}
                    role="listbox"
                    aria-label={`Select sample for ${lane.label}`}
                  >
                    {samples.map((sample) => (
                      <button
                        aria-selected={sample.id === lane.sampleId}
                        className={`${styles.sampleOption} ${
                          sample.id === lane.sampleId
                            ? styles.sampleOptionSelected
                            : ""
                        }`}
                        key={sample.id}
                        onClick={() => {
                          onLaneSampleChange(lane.id, sample);
                          setOpenSampleLaneId(null);
                        }}
                        role="option"
                        type="button"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                ) : null}
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
