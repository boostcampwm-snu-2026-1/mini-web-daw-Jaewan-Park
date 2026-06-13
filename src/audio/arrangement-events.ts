import {
  isAudioClip,
  isHybridClip,
  type Clip,
  type ClipInstance,
} from "../model";
import type { NoteLoopEvent, SampleLoopEvent } from "./types";

export interface ArrangementPlaybackEvents {
  missingClipIds: string[];
  noteEvents: NoteLoopEvent[];
  sampleEvents: SampleLoopEvent[];
}

export function expandClipInstancesForPlayback({
  clipInstances,
  clips,
}: {
  clipInstances: readonly ClipInstance[];
  clips: readonly Clip[];
}): ArrangementPlaybackEvents {
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  const missingClipIds: string[] = [];
  const noteEvents: NoteLoopEvent[] = [];
  const sampleEvents: SampleLoopEvent[] = [];

  for (const instance of clipInstances) {
    const clip = clipsById.get(instance.clipId);

    if (!clip) {
      missingClipIds.push(instance.clipId);
      continue;
    }

    if (isAudioClip(clip)) {
      if (instance.lengthTicks > 0) {
        sampleEvents.push({
          id: `${instance.id}:audio`,
          sampleId: clip.sampleId,
          startTick: instance.startTick,
          trackId: instance.trackId,
        });
      }

      continue;
    }

    if (!isHybridClip(clip)) {
      continue;
    }

    for (const event of clip.drumEvents) {
      if (event.startTick >= instance.lengthTicks) {
        continue;
      }

      sampleEvents.push({
        gain: event.velocity,
        id: `${instance.id}:${event.id}`,
        sampleId: event.sampleId,
        startTick: instance.startTick + event.startTick,
        trackId: instance.trackId,
      });
    }

    for (const event of clip.noteEvents) {
      if (event.startTick >= instance.lengthTicks) {
        continue;
      }

      noteEvents.push({
        durationTicks: event.durationTicks,
        gain: event.velocity,
        id: `${instance.id}:${event.id}`,
        instrumentId: event.instrumentId,
        midiNote: event.midiNote,
        startTick: instance.startTick + event.startTick,
        trackId: instance.trackId,
      });
    }
  }

  return {
    missingClipIds,
    noteEvents,
    sampleEvents,
  };
}
