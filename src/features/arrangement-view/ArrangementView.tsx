import type { CSSProperties } from "react";

import { Icon } from "../../components";
import styles from "./ArrangementView.module.css";
import { MixerPanel } from "./MixerPanel";

const TRACK_HEADER_WIDTH = 192;
const RULER_HEIGHT = 32;
const BAR_WIDTH = 128;
const BEATS_PER_BAR = 4;
const BAR_COUNT = 16;
const TRACK_COUNT = 12;
const CLIP_ROW_INSET = 4;
const TIMELINE_WIDTH = BAR_WIDTH * BAR_COUNT;

type ArrangementStyle = CSSProperties & Record<`--${string}`, string>;

interface ArrangementTrack {
  id: string;
  name: string;
  active: boolean;
}

interface ArrangementClip {
  id: string;
  title: string;
  kind: "audio" | "midi";
  startBeat: number;
  trackIndex: number;
  widthBeats: number;
  color: "primary" | "secondary";
}

const arrangementTracks: ArrangementTrack[] = Array.from(
  { length: TRACK_COUNT },
  (_, index) => ({
    active: index < 2,
    id: `track-${index + 1}`,
    name: `Track ${index + 1}`,
  }),
);

const arrangementClips: ArrangementClip[] = [
  {
    color: "primary",
    id: "clip-lead-synth",
    kind: "midi",
    startBeat: 0,
    title: "CLIP 1",
    trackIndex: 0,
    widthBeats: 8,
  },
  {
    color: "secondary",
    id: "clip-sub-bass",
    kind: "midi",
    startBeat: 4,
    title: "CLIP 2",
    trackIndex: 1,
    widthBeats: 8,
  },
];

const barNumbers = Array.from({ length: BAR_COUNT }, (_, index) => index + 1);

export function ArrangementView() {
  const rootStyle: ArrangementStyle = {
    "--arrangement-bar-width": `${BAR_WIDTH}px`,
    "--arrangement-beat-width": `${BAR_WIDTH / BEATS_PER_BAR}px`,
    "--arrangement-ruler-height": `${RULER_HEIGHT}px`,
    "--arrangement-timeline-width": `${TIMELINE_WIDTH}px`,
    "--arrangement-track-header-width": `${TRACK_HEADER_WIDTH}px`,
    "--arrangement-track-count": `${TRACK_COUNT}`,
  };

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
          <div className={styles.snapControl} aria-label="Arrangement snap setting">
            <span className={styles.controlLabel}>Snap</span>
            <span className={styles.controlValue}>Line</span>
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
            {arrangementTracks.map((track) => (
              <div className={styles.trackHeader} key={track.id}>
                <div className={styles.trackNameGroup}>
                  <span
                    className={`${styles.trackName} ${
                      track.active ? "" : styles.trackNameMuted
                    }`}
                  >
                    {track.name}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className={`${styles.trackStatus} ${
                    track.active ? styles.trackStatusActive : ""
                  }`}
                />
              </div>
            ))}
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

            <div className={styles.timelineGrid}>
              <div aria-hidden="true" className={styles.laneGrid} />
              <div aria-hidden="true" className={styles.beatGrid} />
              <div className={styles.clipLayer} aria-label="Arrangement clips">
                {arrangementClips.map((clip) => (
                  <div
                    className={`${styles.clipBlock} ${
                      clip.color === "primary"
                        ? styles.clipBlockPrimary
                        : styles.clipBlockSecondary
                    }`}
                    key={clip.id}
                    style={getClipStyle(clip)}
                  >
                    <div className={styles.clipHeader}>
                      <span>{clip.title}</span>
                    </div>
                    <ClipContent kind={clip.kind} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MixerPanel tracks={arrangementTracks} />
    </section>
  );
}

function ClipContent({ kind }: { kind: ArrangementClip["kind"] }) {
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

function getClipStyle(clip: ArrangementClip): CSSProperties {
  const beatWidth = BAR_WIDTH / BEATS_PER_BAR;
  const trackTopPercent = (clip.trackIndex / TRACK_COUNT) * 100;
  const trackHeightPercent = 100 / TRACK_COUNT;

  return {
    height: `calc(${trackHeightPercent}% - ${CLIP_ROW_INSET * 2}px)`,
    left: `${clip.startBeat * beatWidth}px`,
    top: `calc(${trackTopPercent}% + ${CLIP_ROW_INSET}px)`,
    width: `${clip.widthBeats * beatWidth}px`,
  };
}
