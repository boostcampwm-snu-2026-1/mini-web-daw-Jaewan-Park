import { Panel } from "../../components";
import {
  DRUM_LANES,
  DRUM_STEP_COUNT,
  isDrumStepActive,
  type DrumEvent,
  type DrumLaneId,
} from "../../model";
import styles from "./DrumSequencer.module.css";

interface DrumSequencerProps {
  drumEvents: readonly DrumEvent[];
  onStepToggle: (laneId: DrumLaneId, stepIndex: number) => void;
}

export function DrumSequencer({
  drumEvents,
  onStepToggle,
}: DrumSequencerProps) {
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

        {DRUM_LANES.map((lane) => (
          <div className={styles.lane} key={lane.id}>
            <div className={styles.laneControls}>
              <span className={styles.laneLabel}>{lane.label}</span>
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
