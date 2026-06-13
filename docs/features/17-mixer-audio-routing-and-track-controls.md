# Feature: 17 Mixer Audio Routing and Track Controls

## Status
In Review

## Goal

Connect the existing `SONG` mixer panel to real audio behavior.

The first functional mixer should support per-track routing, track volume, master volume, mute, solo, and runtime level meters for arrangement playback.

## Context

The current mixer panel is intentionally a UI shell. It renders channel strips, faders, mute/solo controls, level meters, effect-slot placeholders, and a master strip, but those controls do not affect Web Audio playback.

The app now needs a focused mixer-routing step so arrangement playback can be balanced across tracks. This should happen after track-aware arrangement playback exists, because mixer routing needs each scheduled source to know which arrangement track it belongs to.

## Scope

Included:
- Add serializable mixer state for arrangement tracks.
- Add serializable master mixer state.
- Route arrangement playback sources through track gain nodes.
- Route track outputs through a master gain node before `AudioContext.destination`.
- Make track volume faders control real track gain.
- Make the master fader control real master gain.
- Make mute and solo buttons affect actual track audibility.
- Add runtime level metering for track channels and master output where practical.
- Update the existing mixer panel to display live or near-live meter values.
- Keep existing effect slots visible as placeholders.
- Add focused tests for mixer state transformations, decibel-to-gain conversion, and mute/solo effective-gain logic.
- Update relevant architecture, data model, audio engine, UI, and testing docs.

Excluded:
- Audio effects or effect chain processing.
- Effect preset persistence.
- Mixer automation.
- Pan controls.
- Sends, buses, groups, sidechain routing, or recording arm.
- Offline export or render-to-file behavior.
- Persistent project export/import beyond documenting serializable state shape.
- Reworking the mixer panel visual design beyond what is needed to wire controls.
- Runtime dependencies.

## Constraints

- This feature depends on arrangement playback having track-aware scheduled sources.
- React UI must not own exact audio timing.
- Web Audio nodes, `AnalyserNode` instances, meter buffers, active source nodes, and routing graph objects are runtime-only.
- Project data may store mixer settings such as volume, mute, and solo, but not runtime audio objects.
- Use CSS Modules and semantic design tokens.
- Preserve the primitive-to-semantic token policy.
- Keep effect slots clearly nonfunctional until an effects feature implements real processing.

## Data Model Notes

Track mixer settings should be serializable.

Recommended first shape:

```ts
export interface TrackMixerState {
  trackId: string;
  volumeDb: number;
  muted: boolean;
  solo: boolean;
}

export interface MasterMixerState {
  volumeDb: number;
}
```

Track mixer state may live on each `Track` or in a project-level map keyed by `trackId`. Choose the representation that best fits the existing model implementation, but keep it serializable and easy to test.

Suggested default values:

```text
track volumeDb = 0
track muted = false
track solo = false
master volumeDb = 0
```

Use a safe fader range such as `-60 dB` to `+6 dB`, with `-60 dB` treated as near-silent. A later feature can add a stricter `-Infinity` representation if needed.

Mute and solo should have deterministic effective audibility:

```text
anySolo = at least one track has solo = true
trackAudible = (!anySolo || track.solo) && !track.muted
```

If a track is both muted and soloed, muted wins and the track remains silent. This rule is simple to test and avoids hidden UI behavior.

## Audio Engine Notes

The audio engine should own the routing graph:

```text
scheduled source
  -> track gain node
  -> optional track meter analyser
  -> master gain node
  -> optional master meter analyser
  -> AudioContext.destination
```

Track gain nodes should be keyed by stable `trackId`. When arrangement playback schedules a source, that source should connect to the appropriate track channel instead of directly to the destination.

Mixer control updates should be handled through a small typed API, for example:

```ts
setTrackVolume(trackId, volumeDb)
setTrackMute(trackId, muted)
setTrackSolo(trackId, solo)
setMasterVolume(volumeDb)
getMixerLevels()
```

Implementation names may differ, but React components should not manipulate Web Audio nodes directly.

Level meters are runtime display data. The UI may poll meter snapshots with `requestAnimationFrame` or subscribe through a lightweight audio-engine callback. Meter display timing does not drive audio scheduling.

## UI Notes

Use the existing bottom dock mixer panel.

Functional behavior:

- Track faders update track volume.
- Master fader updates master volume.
- `M` toggles real mute.
- `S` toggles real solo.
- Track meters respond to that track's audio signal.
- Master meter responds to the summed output signal.

The UI should still be clear when no arrangement playback is active:

- Meters may sit at zero.
- Faders and mute/solo buttons remain editable.
- Settings should affect the next playback start.

Effect slots should remain visibly disabled or placeholder-only. Do not imply that effects are active.

## Done when

- Arrangement playback routes each scheduled source through a track mixer channel.
- Track volume faders change the audible level of their own track during playback.
- The master fader changes overall output level during playback.
- Muting a track makes that track silent.
- Soloing one or more tracks makes only audible soloed tracks play.
- If a track is both muted and soloed, it remains silent.
- Track meters show runtime audio level for active tracks.
- The master meter shows runtime output level.
- Stopping playback clears or decays visible meter levels without stuck values.
- Mixer settings are represented as serializable state where appropriate.
- Runtime Web Audio graph objects are not stored in project JSON or React component state.
- Existing `PAT` mode playback still works.
- Relevant tests and docs are updated.

## Verification

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Manual check:
- Place clips on at least two arrangement tracks.
- Start `SONG` playback.
- Move a track fader and confirm only that track changes level.
- Move the master fader and confirm overall output changes.
- Mute a track and confirm it becomes silent.
- Solo one track and confirm non-solo tracks become silent.
- Solo multiple tracks and confirm only those tracks remain audible.
- Mute a soloed track and confirm it remains silent.
- Confirm track and master meters respond to playback.
- Stop playback and confirm meters settle instead of staying stuck.
- Confirm `PAT` mode playback still works.

## PR notes

- Reference issue #43.
- Explain the mixer state representation.
- Explain how scheduled sources route through track and master gain nodes.
- Explain the mute/solo effective-audibility rule.
- State clearly that effects, automation, pan, sends, buses, and export rendering are deferred.
