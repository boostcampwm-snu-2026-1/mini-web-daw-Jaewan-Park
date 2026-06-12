import { useState, type CSSProperties } from "react";

import styles from "./MixerPanel.module.css";

export interface MixerTrack {
  id: string;
  name: string;
  active: boolean;
}

interface MixerPanelProps {
  tracks: readonly MixerTrack[];
}

interface MixerChannelState {
  effectLabel: "None" | "Basic";
  meterLevel: number;
  muted: boolean;
  solo: boolean;
  volume: number;
}

const MASTER_CHANNEL_ID = "master";
const DEFAULT_VOLUME = 78;

export function MixerPanel({ tracks }: MixerPanelProps) {
  const [channelStates, setChannelStates] = useState(() =>
    createInitialChannelStates(tracks),
  );
  const mixerChannels = [
    ...tracks.map((track) => ({
      active: track.active,
      id: track.id,
      name: track.name,
      role: "track" as const,
    })),
    {
      active: true,
      id: MASTER_CHANNEL_ID,
      name: "Master",
      role: "master" as const,
    },
  ];

  function updateChannelState(
    channelId: string,
    patch: Partial<MixerChannelState>,
  ) {
    setChannelStates((currentStates) => ({
      ...currentStates,
      [channelId]: {
        ...getChannelState(currentStates, channelId),
        ...patch,
      },
    }));
  }

  return (
    <section className={styles.mixerPanel} aria-label="Arrangement mixer panel">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MIXER</p>
          <h2 className={styles.title}>Track Channel Strips</h2>
        </div>
        <p className={styles.statusText}>UI shell / mock meters</p>
      </header>

      <div className={styles.stripScroller}>
        <div className={styles.stripRow}>
          {mixerChannels.map((channel) => {
            const channelState = getChannelState(channelStates, channel.id);

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
                    isMuted={channelState.muted}
                    level={channelState.meterLevel}
                  />
                  <label className={styles.faderGroup}>
                    <span className={styles.faderLabel}>Vol</span>
                    <input
                      aria-label={`${channel.name} volume`}
                      className={styles.fader}
                      max="100"
                      min="0"
                      onChange={(event) =>
                        updateChannelState(channel.id, {
                          volume: Number(event.currentTarget.value),
                        })
                      }
                      type="range"
                      value={channelState.volume}
                    />
                    <span className={styles.volumeValue}>
                      {channelState.volume}
                    </span>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <button
                    aria-label={`Mute ${channel.name}`}
                    aria-pressed={channelState.muted}
                    className={`${styles.toggleButton} ${
                      channelState.muted ? styles.muteActive : ""
                    }`}
                    onClick={() =>
                      updateChannelState(channel.id, {
                        muted: !channelState.muted,
                      })
                    }
                    type="button"
                  >
                    M
                  </button>
                  <button
                    aria-label={`Solo ${channel.name}`}
                    aria-pressed={channelState.solo}
                    className={`${styles.toggleButton} ${
                      channelState.solo ? styles.soloActive : ""
                    }`}
                    onClick={() =>
                      updateChannelState(channel.id, {
                        solo: !channelState.solo,
                      })
                    }
                    type="button"
                  >
                    S
                  </button>
                </div>

                <button
                  aria-label={`Toggle ${channel.name} effect placeholder`}
                  className={styles.effectSlot}
                  onClick={() =>
                    updateChannelState(channel.id, {
                      effectLabel:
                        channelState.effectLabel === "None" ? "Basic" : "None",
                    })
                  }
                  type="button"
                >
                  FX: {channelState.effectLabel}
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
    height: `${isMuted ? 0 : level}%`,
  } satisfies CSSProperties;

  return (
    <div className={styles.meter} aria-label="Mock level meter">
      <span className={styles.meterFill} style={meterStyle} />
    </div>
  );
}

function createInitialChannelStates(
  tracks: readonly MixerTrack[],
): Record<string, MixerChannelState> {
  return Object.fromEntries(
    [
      ...tracks.map((track, index) => [
        track.id,
        createChannelState({
          active: track.active,
          index,
          volume: DEFAULT_VOLUME,
        }),
      ]),
      [
        MASTER_CHANNEL_ID,
        createChannelState({
          active: true,
          index: tracks.length,
          volume: 82,
        }),
      ],
    ],
  );
}

function createChannelState({
  active,
  index,
  volume,
}: {
  active: boolean;
  index: number;
  volume: number;
}): MixerChannelState {
  return {
    effectLabel: "None",
    meterLevel: active ? 32 + ((index * 13) % 58) : 0,
    muted: false,
    solo: false,
    volume,
  };
}

function getChannelState(
  channelStates: Readonly<Record<string, MixerChannelState>>,
  channelId: string,
): MixerChannelState {
  return (
    channelStates[channelId] ?? {
      effectLabel: "None",
      meterLevel: 0,
      muted: false,
      solo: false,
      volume: DEFAULT_VOLUME,
    }
  );
}
