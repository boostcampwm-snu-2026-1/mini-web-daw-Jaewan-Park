# Audio Engine

## Responsibilities

- Manage `AudioContext` lifecycle.
- Load and decode sample assets.
- Play one-shot samples.
- Convert tick positions to audio time using tempo and PPQ.
- Schedule sequenced playback with a lookahead scheduler.
- Track transport state such as stopped, playing, paused, tempo, loop range, and playhead position.
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

## Basic Synth Note Playback

The first piano roll playback path may use a simple Web Audio oscillator synth rather than stretching short sample files. This keeps held notes predictable because note duration comes from `durationTicks`.

Basic synth note playback should:

- Convert `midiNote` to oscillator frequency at scheduling time.
- Convert `durationTicks` to seconds using tempo and PPQ.
- Schedule oscillator start and stop against `AudioContext.currentTime`.
- Use a short gain envelope to avoid clicks.
- Treat oscillator nodes and gain nodes as runtime-only objects.

This is not a full sampler instrument. Bundled pitched sample metadata can exist for future sampler work, but the initial held-note behavior should not depend on sample length.

The oscillator instrument should be kept as `Default Synth` when sample-based pitched instruments are added. It is useful as a reliable fallback because it can sustain notes for arbitrary durations without sample loop metadata.

## Sample-based Pitched Playback

Iowa Piano should be a separate pitched instrument from `Default Synth`. It should use the bundled C4-C5 Iowa Piano WAV files when the piano roll note pitch has a matching sample.

Sample-based pitched playback should:

- Look up the selected pitched instrument.
- Map `midiNote` to a sample zone or bundled sample ID.
- Load and decode the sample into the runtime cache.
- Create a new `AudioBufferSourceNode` for each scheduled note.
- Schedule note start against `AudioContext.currentTime`.
- Convert `durationTicks` to seconds from tempo and PPQ.
- Use a gain envelope for attack and release.
- Stop or release active voices when transport stops.

The first Iowa Piano implementation should make a practical attempt at sustained notes. A sample zone may define `loopStartSeconds` and `loopEndSeconds`; if those values are present, the source node may use `loop = true` with those loop points. Loop metadata is serializable instrument/sample metadata, but decoded buffers and active source nodes are runtime-only.

Do not attempt automatic loop point detection in the first pass. If a loop point needs tuning, update the explicit metadata and document the decision.

## Lookahead Scheduler Concept

Do not rely on UI timers for exact playback. Sequenced playback should use a timer that wakes frequently, looks ahead by a short scheduling window, and schedules Web Audio events against `AudioContext.currentTime`.

Example terms:

- `lookaheadMs`: how often the scheduler wakes.
- `scheduleAheadTime`: how far into the future audio events are scheduled.
- `nextTick`: next musical tick to inspect.
- `loopStartTick` and `loopEndTick`: musical loop boundaries.

The browser audio engine exposes sample loop playback through a typed API that accepts tick-based sample events, tempo, loop bounds, lookahead cadence, and schedule-ahead time. The scheduler itself is independent from React and can be unit tested without DOM rendering.

The transport API should allow playback to start from a tick offset when resuming from pause. The offset is runtime state only and should be passed as a `startTick` option, not persisted into project data.

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

- Playback state: `stopped`, `playing`, or `paused`.
- Tempo in BPM.
- Current tick.
- Audio start time.
- Tick start offset.
- Loop enabled state.
- Loop start and end ticks.

Transport state may be mirrored into React for display, but React render timing must not drive exact audio playback.

Pause and stop have different meanings:

- Pause captures the current runtime playhead tick and stops future scheduling. Resume should continue from that tick.
- Stop clears scheduling and resets the runtime playhead tick to the loop start, which is tick 0 for the M1 1-bar clip.
- The paused playhead position is runtime state only. It should not be written to project JSON.

The audio engine should expose pause separately from stop. A pause operation preserves the scheduler object and its current tick snapshot; a stop operation clears the active loop and returns the transport to the loop start.

## Looping Behavior

For M1, loop playback targets a selected 1-bar clip. The default loop range is 0 to 1920 ticks.

Events at the loop start should play when the loop begins. Events at the loop end should belong to the next loop iteration only if explicitly represented there; avoid double-triggering boundary events.

Loop stop clears the scheduler timer and prevents future windows from being scheduled. Events already submitted to Web Audio inside the current schedule-ahead window may still play briefly; keep `scheduleAheadTime` short enough that this limitation remains acceptable for interactive editing.

When the user edits a drum pattern during playback, the UI may update the scheduler's event list without restarting transport. Newly scheduled windows should use the latest serializable drum events. Events already submitted to Web Audio inside the current schedule-ahead window may still reflect the previous pattern because Web Audio scheduled source nodes cannot be unscheduled after `start(when)`.

When the user edits piano roll notes during playback, the UI may update the same selected-clip loop event list with the latest serializable note events. Newly scheduled windows should use the latest note positions and durations. Already scheduled synth voices inside the current schedule-ahead window may briefly reflect the previous note data.

## UI Playhead Separation

UI cursor and playhead animation may use `requestAnimationFrame` and read transport position from the audio engine. Visual playhead timing can be approximate. Exact sound timing must come from scheduled Web Audio events.

The UI may render a vertical playhead over the piano roll or drum sequencer by converting the current runtime tick into editor geometry. The playhead should wrap at the active loop boundary. It is display feedback only; moving or rendering the playhead must not be required for audio events to play on time.

## Future Extension Points

- Sampler instrument.
- Synth instruments.
- Mixer.
- Effects.
- Offline/export rendering later.
