# Audio Engine

## Responsibilities

- Manage `AudioContext` lifecycle.
- Load and decode sample assets.
- Play one-shot samples.
- Convert tick positions to audio time using tempo and PPQ.
- Schedule sequenced playback with a lookahead scheduler.
- Track transport state such as stopped, playing, tempo, loop range, and playhead position.
- Expose a small typed API to the UI.

## Non-responsibilities

- Rendering React components.
- Owning project JSON persistence.
- Storing serializable project state.
- Handling visual layout.
- Implementing a full DAW mixer during early milestones.

## AudioContext Lifecycle

Create the `AudioContext` in response to a user gesture when possible. Provide explicit start/resume and stop/suspend behavior. Browser autoplay policies mean audio setup must tolerate a suspended context until the user interacts.

The app should have one primary audio engine instance for normal playback.

## Sample Loading and Decoding

Bundled sample files should be fetched as array buffers, decoded with `AudioContext.decodeAudioData`, and stored in a runtime cache keyed by `sampleId`.

Decoded sample data is not serializable project data. Project JSON stores sample metadata and stable references only.

In the browser implementation, decoded buffers should live in the audio engine runtime cache, not in React state or project data. UI code should trigger loading through the typed audio engine API and may display loaded sample IDs or context state returned by that API.

## One-shot Sample Playback

Use a new `AudioBufferSourceNode` for every one-shot playback. A source node cannot be restarted after it has played.

Basic one-shot playback should:

- Look up the decoded `AudioBuffer` by `sampleId`.
- Create a source node.
- Connect it to the appropriate destination or gain node.
- Schedule `source.start(when)`.

## Lookahead Scheduler Concept

Do not rely on UI timers for exact playback. Sequenced playback should use a timer that wakes frequently, looks ahead by a short scheduling window, and schedules Web Audio events against `AudioContext.currentTime`.

Example terms:

- `lookaheadMs`: how often the scheduler wakes.
- `scheduleAheadTime`: how far into the future audio events are scheduled.
- `nextTick`: next musical tick to inspect.
- `loopStartTick` and `loopEndTick`: musical loop boundaries.

The browser audio engine exposes sample loop playback through a typed API that accepts tick-based sample events, tempo, loop bounds, lookahead cadence, and schedule-ahead time. The scheduler itself is independent from React and can be unit tested without DOM rendering.

## Tick-to-audio-time Conversion

Ticks convert to seconds using tempo and PPQ:

```ts
secondsPerBeat = 60 / tempoBpm;
secondsPerTick = secondsPerBeat / ppq;
seconds = ticks * secondsPerTick;
```

The documented default is PPQ 480. In 4/4, one bar is 1920 ticks and one 16-step grid step is 120 ticks.

## Transport State

Transport state should include:

- Playing or stopped state.
- Tempo in BPM.
- Current tick.
- Audio start time.
- Tick start offset.
- Loop enabled state.
- Loop start and end ticks.

Transport state may be mirrored into React for display, but React render timing must not drive exact audio playback.

## Looping Behavior

For M1, loop playback targets a selected 1-bar clip. The default loop range is 0 to 1920 ticks.

Events at the loop start should play when the loop begins. Events at the loop end should belong to the next loop iteration only if explicitly represented there; avoid double-triggering boundary events.

Loop stop clears the scheduler timer and prevents future windows from being scheduled. Events already submitted to Web Audio inside the current schedule-ahead window may still play briefly; keep `scheduleAheadTime` short enough that this limitation remains acceptable for interactive editing.

## UI Playhead Separation

UI cursor and playhead animation may use `requestAnimationFrame` and read transport position from the audio engine. Visual playhead timing can be approximate. Exact sound timing must come from scheduled Web Audio events.

## Future Extension Points

- Sampler instrument.
- Synth instruments.
- Mixer.
- Effects.
- Offline/export rendering later.
