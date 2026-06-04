import { useState } from "react";

import { Panel } from "../../components";
import styles from "./DrumSequencer.module.css";

interface DrumLane {
  id: string;
  label: string;
}

const drumLanes: DrumLane[] = [
  { id: "kick", label: "KICK" },
  { id: "snare", label: "SNARE" },
  { id: "closedHat", label: "CLOSED HI-HAT" },
  { id: "openHat", label: "OPEN HI-HAT" },
];

type StepState = Record<string, Set<number>>;

export function DrumSequencer() {
  const [stepState, setStepState] = useState<StepState>(() => {
    const initialState: StepState = {};

    for (const lane of drumLanes) {
      initialState[lane.id] = new Set<number>();
    }

    return initialState;
  });

  function handleStepToggle(laneId: string, stepIndex: number) {
    setStepState((currentState) => {
      const nextLaneSteps = new Set(currentState[laneId]);

      if (nextLaneSteps.has(stepIndex)) {
        nextLaneSteps.delete(stepIndex);
      } else {
        nextLaneSteps.add(stepIndex);
      }

      return {
        ...currentState,
        [laneId]: nextLaneSteps,
      };
    });
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
            {Array.from({ length: 16 }, (_, stepIndex) => {
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

        {drumLanes.map((lane) => (
          <div className={styles.lane} key={lane.id}>
            <div className={styles.laneControls}>
              <span className={styles.laneLabel}>{lane.label}</span>
              <div className={styles.knobGroup} aria-hidden="true">
                <span className={styles.knob} />
                <span className={styles.knob} />
              </div>
            </div>

            <div className={styles.steps}>
              {Array.from({ length: 16 }, (_, stepIndex) => {
                const isActive = stepState[lane.id]?.has(stepIndex) ?? false;
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
                    onClick={() => handleStepToggle(lane.id, stepIndex)}
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
