import {
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { Icon } from "../../components";
import {
  ARRANGEMENT_BAR_COUNT,
  ARRANGEMENT_CLIP_DRAG_TYPE,
  ARRANGEMENT_CLIP_INSTANCE_DRAG_TYPE,
  getArrangementLoopBoundaryIndex,
  type ArrangementLoopRange,
  type ArrangementTrack,
  type Clip,
  type ClipInstance,
  isAudioClip,
} from "../../model";
import { TICKS_PER_4_4_BAR, type Tick } from "../../utils";
import styles from "./ArrangementView.module.css";
import { MixerPanel } from "./MixerPanel";

const TRACK_HEADER_WIDTH = 192;
const RULER_HEIGHT = 32;
const BAR_WIDTH = 128;
const BEATS_PER_BAR = 4;
const CLIP_ROW_INSET = 4;
const TIMELINE_WIDTH = BAR_WIDTH * ARRANGEMENT_BAR_COUNT;

type ArrangementStyle = CSSProperties & Record<`--${string}`, string>;

interface ArrangementViewProps {
  clipInstances: readonly ClipInstance[];
  clips: readonly Clip[];
  errorMessage?: string | null;
  loopRange: ArrangementLoopRange;
  onClipDrop: (placement: {
    clipId: string;
    startTick: Tick;
    trackId: string;
  }) => void;
  onClipInstanceDelete: (instanceId: string) => void;
  onClipInstanceMove: (placement: {
    instanceId: string;
    startTick: Tick;
    trackId: string;
  }) => void;
  onClipInstanceSelect: (instanceId: string) => void;
  onLoopRangeChange: (loopRange: ArrangementLoopRange) => void;
  playheadTick: Tick;
  selectedClipInstanceId: string | null;
  shouldShowPlayhead: boolean;
  tracks: readonly ArrangementTrack[];
}

const barNumbers = Array.from(
  { length: ARRANGEMENT_BAR_COUNT },
  (_, index) => index + 1,
);
const loopStartBoundaryOptions = Array.from(
  { length: ARRANGEMENT_BAR_COUNT },
  (_, index) => index,
);
const loopEndBoundaryOptions = Array.from(
  { length: ARRANGEMENT_BAR_COUNT },
  (_, index) => index + 1,
);

export function ArrangementView({
  clipInstances,
  clips,
  errorMessage = null,
  loopRange,
  onClipDrop,
  onClipInstanceDelete,
  onClipInstanceMove,
  onClipInstanceSelect,
  onLoopRangeChange,
  playheadTick,
  selectedClipInstanceId,
  shouldShowPlayhead,
  tracks,
}: ArrangementViewProps) {
  const timelineGridRef = useRef<HTMLDivElement>(null);
  const clipById = new Map(clips.map((clip) => [clip.id, clip]));
  const trackIndexById = new Map(
    tracks.map((track, index) => [track.id, index] as const),
  );
  const activeTrackIds = new Set(
    clipInstances.map((instance) => instance.trackId),
  );
  const selectedClipInstance =
    clipInstances.find((instance) => instance.id === selectedClipInstanceId) ??
    null;
  const loopStartBoundaryIndex = getArrangementLoopBoundaryIndex(
    loopRange.startTick,
  );
  const loopEndBoundaryIndex = getArrangementLoopBoundaryIndex(loopRange.endTick);
  const rootStyle: ArrangementStyle = {
    "--arrangement-bar-width": `${BAR_WIDTH}px`,
    "--arrangement-beat-width": `${BAR_WIDTH / BEATS_PER_BAR}px`,
    "--arrangement-ruler-height": `${RULER_HEIGHT}px`,
    "--arrangement-timeline-width": `${TIMELINE_WIDTH}px`,
    "--arrangement-track-count": `${tracks.length}`,
    "--arrangement-track-header-width": `${TRACK_HEADER_WIDTH}px`,
  };

  function handleLoopStartChange(event: ChangeEvent<HTMLSelectElement>) {
    const boundaryIndex = Number.parseInt(event.currentTarget.value, 10);

    onLoopRangeChange({
      endTick: loopRange.endTick,
      startTick: boundaryIndex * TICKS_PER_4_4_BAR,
    });
  }

  function handleLoopEndChange(event: ChangeEvent<HTMLSelectElement>) {
    const boundaryIndex = Number.parseInt(event.currentTarget.value, 10);

    onLoopRangeChange({
      endTick: boundaryIndex * TICKS_PER_4_4_BAR,
      startTick: loopRange.startTick,
    });
  }

  function handleTimelineDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasArrangementDragPayload(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
      ARRANGEMENT_CLIP_INSTANCE_DRAG_TYPE,
    )
      ? "move"
      : "copy";
  }

  function handleTimelineDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasArrangementDragPayload(event)) {
      return;
    }

    event.preventDefault();

    const position = getDropPosition(event, timelineGridRef.current, tracks);

    if (!position) {
      return;
    }

    const instanceId = event.dataTransfer.getData(
      ARRANGEMENT_CLIP_INSTANCE_DRAG_TYPE,
    );

    if (instanceId) {
      onClipInstanceMove({
        instanceId,
        startTick: position.startTick,
        trackId: position.trackId,
      });
      return;
    }

    const clipId = event.dataTransfer.getData(ARRANGEMENT_CLIP_DRAG_TYPE);

    if (clipId) {
      onClipDrop({
        clipId,
        startTick: position.startTick,
        trackId: position.trackId,
      });
    }
  }

  return (
    <section
      aria-label="Arrangement view"
      className={styles.arrangementPanel}
      style={rootStyle}
    >
      <header className={styles.toolbar}>
        <div className={styles.toolbarTitleGroup}>
          <p className={styles.eyebrow}>ARRANGEMENT</p>
        </div>
        <div className={styles.toolbarControls}>
          {errorMessage ? (
            <p className={styles.errorBadge}>{errorMessage}</p>
          ) : null}
          <div className={styles.loopControls} aria-label="Arrangement loop range">
            <label className={styles.loopControl}>
              <span>Loop Start</span>
              <select
                aria-label="Loop start bar boundary"
                className={styles.loopSelect}
                onChange={handleLoopStartChange}
                value={loopStartBoundaryIndex}
              >
                {loopStartBoundaryOptions.map((boundaryIndex) => (
                  <option key={boundaryIndex} value={boundaryIndex}>
                    Bar {boundaryIndex + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.loopControl}>
              <span>Loop End</span>
              <select
                aria-label="Loop end bar boundary"
                className={styles.loopSelect}
                onChange={handleLoopEndChange}
                value={loopEndBoundaryIndex}
              >
                {loopEndBoundaryOptions.map((boundaryIndex) => (
                  <option key={boundaryIndex} value={boundaryIndex}>
                    Bar {boundaryIndex + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className={styles.deleteButton}
            disabled={!selectedClipInstance}
            onClick={() => {
              if (selectedClipInstance) {
                onClipInstanceDelete(selectedClipInstance.id);
              }
            }}
            type="button"
          >
            <Icon name="delete" />
            <span>Delete selected</span>
          </button>
          <div className={styles.snapControl} aria-label="Arrangement snap setting">
            <span className={styles.controlLabel}>Snap</span>
            <span className={styles.controlValue}>Beat</span>
            <Icon name="expand_more" />
          </div>
        </div>
      </header>

      <div className={styles.arrangementBody}>
        <aside className={styles.trackHeaderColumn} aria-label="Arrangement tracks">
          <div className={styles.rulerCorner}>
            <Icon name="list" />
          </div>
          <div className={styles.trackRows}>
            {tracks.map((track) => {
              const isTrackActive = activeTrackIds.has(track.id);

              return (
                <div className={styles.trackHeader} key={track.id}>
                  <div className={styles.trackNameGroup}>
                    <span
                      className={`${styles.trackName} ${
                        isTrackActive ? "" : styles.trackNameMuted
                      }`}
                    >
                      {track.name}
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`${styles.trackStatus} ${
                      isTrackActive ? styles.trackStatusActive : ""
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </aside>

        <div className={styles.timelineScroller}>
          <div className={styles.timelineContent}>
            <div className={styles.ruler} aria-label="Timeline ruler">
              {barNumbers.map((barNumber) => (
                <div className={styles.barMarker} key={barNumber}>
                  {barNumber}
                </div>
              ))}
            </div>

            <div
              className={styles.timelineGrid}
              onDragOver={handleTimelineDragOver}
              onDrop={handleTimelineDrop}
              ref={timelineGridRef}
            >
              <div aria-hidden="true" className={styles.laneGrid} />
              <div aria-hidden="true" className={styles.beatGrid} />
              <div className={styles.clipLayer} aria-label="Arrangement clips">
                <div
                  aria-hidden="true"
                  className={styles.loopRegion}
                  style={getLoopRegionStyle(loopRange)}
                />
                <div
                  aria-hidden="true"
                  className={`${styles.loopBoundary} ${styles.loopBoundaryStart}`}
                  style={{ left: `${tickToPixels(loopRange.startTick)}px` }}
                >
                  <span>Loop</span>
                </div>
                <div
                  aria-hidden="true"
                  className={`${styles.loopBoundary} ${styles.loopBoundaryEnd}`}
                  style={{ left: `${tickToPixels(loopRange.endTick)}px` }}
                />
                {clipInstances.map((instance) => {
                  const clip = clipById.get(instance.clipId);

                  if (!clip) {
                    return null;
                  }

                  const isSelected = instance.id === selectedClipInstanceId;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`${styles.clipBlock} ${
                        isAudioClip(clip)
                          ? styles.clipBlockSecondary
                          : styles.clipBlockPrimary
                      } ${isSelected ? styles.clipBlockSelected : ""}`}
                      draggable
                      key={instance.id}
                      onClick={() => onClipInstanceSelect(instance.id)}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData(
                          ARRANGEMENT_CLIP_INSTANCE_DRAG_TYPE,
                          instance.id,
                        );
                      }}
                      onKeyDown={(event) =>
                        handleClipBlockKeyDown({
                          event,
                          instanceId: instance.id,
                          onClipInstanceDelete,
                        })
                      }
                      style={getClipStyle({
                        instance,
                        trackIndex: trackIndexById.get(instance.trackId) ?? 0,
                        trackCount: tracks.length,
                      })}
                      type="button"
                    >
                      <div className={styles.clipHeader}>
                        <span>{clip.name}</span>
                      </div>
                      <ClipContent kind={isAudioClip(clip) ? "audio" : "midi"} />
                    </button>
                  );
                })}

                {clipInstances.length === 0 ? (
                  <p className={styles.emptyState}>
                    Drag clips from the sidebar into a track.
                  </p>
                ) : null}

                {shouldShowPlayhead ? (
                  <div
                    aria-hidden="true"
                    className={styles.playhead}
                    style={{ left: `${tickToPixels(playheadTick)}px` }}
                  >
                    <span className={styles.playheadHandle} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MixerPanel tracks={tracks.map((track) => ({
        active: activeTrackIds.has(track.id),
        id: track.id,
        name: track.name,
      }))} />
    </section>
  );
}

function ClipContent({ kind }: { kind: "audio" | "midi" }) {
  if (kind === "audio") {
    return (
      <svg
        aria-hidden="true"
        className={styles.waveform}
        preserveAspectRatio="none"
        viewBox="0 0 200 40"
      >
        <path
          d="M0 20 Q8 8 16 20 T32 20 T48 20 T64 16 T80 24 T96 20 T112 10 T128 30 T144 20 T160 18 T176 22 T200 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={styles.midiPreview}
      preserveAspectRatio="none"
      viewBox="0 0 100 28"
    >
      <rect height="4" rx="1" width="18" x="5" y="7" />
      <rect height="4" rx="1" width="16" x="30" y="13" />
      <rect height="4" rx="1" width="24" x="52" y="6" />
      <rect height="4" rx="1" width="12" x="82" y="17" />
    </svg>
  );
}

function getLoopRegionStyle(loopRange: ArrangementLoopRange): CSSProperties {
  return {
    left: `${tickToPixels(loopRange.startTick)}px`,
    width: `${Math.max(1, tickToPixels(loopRange.endTick - loopRange.startTick))}px`,
  };
}

function getClipStyle({
  instance,
  trackCount,
  trackIndex,
}: {
  instance: ClipInstance;
  trackCount: number;
  trackIndex: number;
}): CSSProperties {
  const boundedTrackCount = Math.max(1, trackCount);
  const trackTopPercent = (trackIndex / boundedTrackCount) * 100;
  const trackHeightPercent = 100 / boundedTrackCount;

  return {
    height: `calc(${trackHeightPercent}% - ${CLIP_ROW_INSET * 2}px)`,
    left: `${tickToPixels(instance.startTick)}px`,
    top: `calc(${trackTopPercent}% + ${CLIP_ROW_INSET}px)`,
    width: `${Math.max(32, tickToPixels(instance.lengthTicks))}px`,
  };
}

function getDropPosition(
  event: DragEvent<HTMLDivElement>,
  timelineGrid: HTMLDivElement | null,
  tracks: readonly ArrangementTrack[],
): { startTick: Tick; trackId: string } | null {
  if (!timelineGrid || tracks.length === 0) {
    return null;
  }

  const rect = timelineGrid.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const trackHeight = rect.height / tracks.length;
  const trackIndex = clamp(Math.floor(y / trackHeight), 0, tracks.length - 1);

  return {
    startTick: pixelsToTicks(x),
    trackId: tracks[trackIndex]?.id ?? tracks[0]!.id,
  };
}

function handleClipBlockKeyDown({
  event,
  instanceId,
  onClipInstanceDelete,
}: {
  event: KeyboardEvent<HTMLButtonElement>;
  instanceId: string;
  onClipInstanceDelete: (instanceId: string) => void;
}) {
  if (event.key !== "Delete" && event.key !== "Backspace") {
    return;
  }

  event.preventDefault();
  onClipInstanceDelete(instanceId);
}

function hasArrangementDragPayload(event: DragEvent<HTMLElement>): boolean {
  return (
    event.dataTransfer.types.includes(ARRANGEMENT_CLIP_DRAG_TYPE) ||
    event.dataTransfer.types.includes(ARRANGEMENT_CLIP_INSTANCE_DRAG_TYPE)
  );
}

function tickToPixels(tick: Tick): number {
  return (tick / TICKS_PER_4_4_BAR) * BAR_WIDTH;
}

function pixelsToTicks(pixels: number): Tick {
  return (Math.max(0, pixels) / BAR_WIDTH) * TICKS_PER_4_4_BAR;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
