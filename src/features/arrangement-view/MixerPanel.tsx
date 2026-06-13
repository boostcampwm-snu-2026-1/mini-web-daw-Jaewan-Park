import type { CSSProperties } from "react";

import type { MixerLevelSnapshot } from "../../audio";
import {
  MIXER_MAX_VOLUME_DB,
  MIXER_MIN_VOLUME_DB,
  getTrackMixerState,
  type MasterMixerState,
  type TrackMixerState,
} from "../../model";
import styles from "./MixerPanel.module.css";

export interface MixerTrack {
  id: string;
  name: string;
  active: boolean;
}

interface MixerPanelProps {
  masterMixerState: MasterMixerState;
  mixerLevels: MixerLevelSnapshot;
  onMasterVolumeChange: (volumeDb: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onTrackVolumeChange: (trackId: string, volumeDb: number) => void;
  tracks: readonly MixerTrack[];
  trackMixerStates: readonly TrackMixerState[];
}

interface MixerChannel {
  active: boolean;
  id: string;
  level: number;
  name: string;
  role: "track" | "master";
  state: MasterMixerState | TrackMixerState;
}

const MASTER_CHANNEL_ID = "master";
const FADER_STEP_DB = 1;

export function MixerPanel({
  masterMixerState,
  mixerLevels,
  onMasterVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onTrackVolumeChange,
  tracks,
  trackMixerStates,
}: MixerPanelProps) {
  const mixerChannels: MixerChannel[] = [
    ...tracks.map((track) => ({
      active: track.active,
      id: track.id,
      level: mixerLevels.trackLevels[track.id] ?? 0,
      name: track.name,
      role: "track" as const,
      state: getTrackMixerState(trackMixerStates, track.id),
    })),
    {
      active: true,
      id: MASTER_CHANNEL_ID,
      level: mixerLevels.masterLevel,
      name: "Master",
      role: "master" as const,
      state: masterMixerState,
    },
  ];

  return (
    <section className={styles.mixerPanel} aria-label="Arrangement mixer panel">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MIXER</p>
        </div>
        <p className={styles.statusText}>Live routing / runtime meters</p>
      </header>

      <div className={styles.stripScroller}>
        <div className={styles.stripRow}>
          {mixerChannels.map((channel) => {
            const isTrackChannel = channel.role === "track";
            const trackState = isTrackChannel
              ? (channel.state as TrackMixerState)
              : null;
            const volumeDb = channel.state.volumeDb;

            return (
              <article
                className={`${styles.channelStrip} ${
                  channel.role === "master" ? styles.masterStrip : ""
                } ${channel.active ? "" : styles.inactiveStrip}`}
                key={channel.id}
              >
                <header className={styles.channelHeader}>
                  <span className={styles.trackName}>{channel.name}</span>
                  <span className={styles.channelRole}>{channel.role}</span>
                </header>

                <div className={styles.controlsGrid}>
                  <LevelMeter
                    isMuted={trackState?.muted ?? false}
                    level={channel.level}
                  />
                  <label className={styles.faderGroup}>
                    <span className={styles.faderLabel}>Vol</span>
                    <input
                      aria-label={`${channel.name} volume`}
                      className={styles.fader}
                      max={MIXER_MAX_VOLUME_DB}
                      min={MIXER_MIN_VOLUME_DB}
                      onChange={(event) => {
                        const nextVolumeDb = Number(event.currentTarget.value);

                        if (isTrackChannel) {
                          onTrackVolumeChange(channel.id, nextVolumeDb);
                          return;
                        }

                        onMasterVolumeChange(nextVolumeDb);
                      }}
                      step={FADER_STEP_DB}
                      type="range"
                      value={volumeDb}
                    />
                    <span className={styles.volumeValue}>
                      {formatVolumeDb(volumeDb)}
                    </span>
                  </label>
                </div>

                {trackState ? (
                  <div className={styles.toggleRow}>
                    <button
                      aria-label={`Mute ${channel.name}`}
                      aria-pressed={trackState.muted}
                      className={`${styles.toggleButton} ${
                        trackState.muted ? styles.muteActive : ""
                      }`}
                      onClick={() => onTrackMuteToggle(channel.id)}
                      type="button"
                    >
                      M
                    </button>
                    <button
                      aria-label={`Solo ${channel.name}`}
                      aria-pressed={trackState.solo}
                      className={`${styles.toggleButton} ${
                        trackState.solo ? styles.soloActive : ""
                      }`}
                      onClick={() => onTrackSoloToggle(channel.id)}
                      type="button"
                    >
                      S
                    </button>
                  </div>
                ) : (
                  <p className={styles.masterLabel}>MASTER OUT</p>
                )}

                <button
                  aria-disabled="true"
                  aria-label={`${channel.name} effect placeholder`}
                  className={styles.effectSlot}
                  disabled
                  type="button"
                >
                  FX: None
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LevelMeter({
  isMuted,
  level,
}: {
  isMuted: boolean;
  level: number;
}) {
  const meterStyle = {
    height: `${Math.round((isMuted ? 0 : level) * 100)}%`,
  } satisfies CSSProperties;

  return (
    <div className={styles.meter} aria-label="Runtime level meter">
      <span className={styles.meterFill} style={meterStyle} />
    </div>
  );
}

function formatVolumeDb(volumeDb: number): string {
  if (volumeDb <= MIXER_MIN_VOLUME_DB) {
    return "-60 dB";
  }

  return `${volumeDb > 0 ? "+" : ""}${volumeDb.toFixed(0)} dB`;
}
