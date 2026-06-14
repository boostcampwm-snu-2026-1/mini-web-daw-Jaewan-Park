# Feature: 21 Arrangement WAV Export

## Status
In Review

## Goal

Render the current arrangement to a downloadable WAV file.

## Context

Users eventually need a final audio file from the arrangement they build in the browser. WAV is the first export target because it can be generated directly from PCM audio without adding a codec dependency.

Export should use the audio engine's musical data and scheduling rules, not UI timers.

## Scope

Included:

- Add an export action for the current arrangement.
- Render the full arrangement length to audio, starting at bar 1.
- Use `OfflineAudioContext` or an equivalent offline audio rendering path.
- Include arranged hybrid clips, imported audio clips, synth/sampler instruments, and mixer routing that exist at the time this feature is implemented.
- Apply track mute, solo, volume, and master gain if mixer routing exists.
- Encode rendered PCM to a downloadable WAV Blob.
- Use a predictable first export format, such as stereo 44.1 kHz 16-bit PCM WAV.
- Show export progress, busy state, and failure feedback.
- Block export with a clear error if required sample data is unavailable.

Excluded:

- MP3, FLAC, AAC, or compressed export.
- Stem export.
- Realtime recording.
- Mastering processors such as loudness normalization or limiting.
- Cloud upload.
- Exporting only selected clips.
- Background worker rendering unless needed for responsiveness.

## Constraints

- Do not rely on React timers or visual playheads for export timing.
- Do not mutate live playback state while exporting.
- Keep offline rendering code separate from React components.
- Keep exported audio deterministic for the same project data and sample assets where practical.
- Do not add an encoder dependency unless native WAV encoding is insufficient and the PR justifies the dependency.

## Done when

- A user can click export and download a WAV file.
- The WAV duration matches the arrangement length.
- Arranged clips render at their expected positions.
- Missing sample data produces a clear export error.
- Live playback can still work after export completes or fails.
- The PR documents which instruments and clip types are included in the first export pass.

## Verification

Run:

- `npm run typecheck --if-present`
- `npm run lint --if-present`
- `npm run test --if-present`
- `npm run build --if-present`

Manual check:

- Build a short arrangement with at least one drum clip and one pitched clip.
- Export WAV.
- Open the WAV in a media player or DAW.
- Confirm the file duration and clip timing are correct.
- Confirm export failure is clear when a required imported sample is missing.

## PR notes

- Summarize the offline rendering path.
- State the WAV format details.
- Mention unsupported clip or instrument types, if any.
