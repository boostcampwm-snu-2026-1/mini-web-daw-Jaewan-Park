import { describe, expect, it } from "vitest";

import {
  LookaheadScheduler,
  collectScheduledEventsForWindow,
  getLoopTickAtAbsoluteTick,
  type ScheduledTickEvent,
  type TickEvent,
} from "../../../src/audio/lookahead-scheduler";

interface TestEvent extends TickEvent {
  label: string;
}

const events: TestEvent[] = [
  { id: "start", label: "start", startTick: 0 },
  { id: "last-step", label: "last-step", startTick: 1800 },
  { id: "loop-end", label: "loop-end", startTick: 1920 },
];

describe("collectScheduledEventsForWindow", () => {
  it("schedules events inside the loop and excludes the loop end", () => {
    const scheduledEvents = collectScheduledEventsForWindow({
      audioStartTime: 10,
      events,
      tempoBpm: 120,
      windowEndTick: 1920,
      windowStartTick: 0,
    });

    expect(scheduledEvents.map((scheduledEvent) => scheduledEvent.event.id)).toEqual([
      "start",
      "last-step",
    ]);
    expect(scheduledEvents[0]?.audioTime).toBeCloseTo(10);
    expect(scheduledEvents[1]?.audioTime).toBeCloseTo(11.875);
  });

  it("does not double-trigger loop boundary events across adjacent windows", () => {
    const firstWindow = collectScheduledEventsForWindow({
      audioStartTime: 0,
      events,
      tempoBpm: 120,
      windowEndTick: 1920,
      windowStartTick: 0,
    });
    const secondWindow = collectScheduledEventsForWindow({
      audioStartTime: 0,
      events,
      tempoBpm: 120,
      windowEndTick: 3840,
      windowStartTick: 1920,
    });

    expect(firstWindow.map((scheduledEvent) => scheduledEvent.absoluteTick)).toEqual([
      0,
      1800,
    ]);
    expect(secondWindow.map((scheduledEvent) => scheduledEvent.absoluteTick)).toEqual([
      1920,
      3720,
    ]);
  });

  it("wraps absolute ticks to loop ticks", () => {
    expect(getLoopTickAtAbsoluteTick({ absoluteTick: 0 })).toBe(0);
    expect(getLoopTickAtAbsoluteTick({ absoluteTick: 1919 })).toBe(1919);
    expect(getLoopTickAtAbsoluteTick({ absoluteTick: 1920 })).toBe(0);
    expect(getLoopTickAtAbsoluteTick({ absoluteTick: 2040 })).toBe(120);
  });
});

describe("LookaheadScheduler", () => {
  it("starts, schedules ahead, and stops", () => {
    let audioTime = 0;
    let intervalHandler: (() => void) | undefined;
    let clearCount = 0;
    const scheduledEvents: ScheduledTickEvent<TestEvent>[] = [];
    const scheduler = new LookaheadScheduler({
      clearIntervalFn: () => {
        clearCount += 1;
        intervalHandler = undefined;
      },
      events: [{ id: "start", label: "start", startTick: 0 }],
      getAudioTime: () => audioTime,
      scheduleAheadTime: 0.2,
      scheduleEvent: (scheduledEvent) => {
        scheduledEvents.push(scheduledEvent);
      },
      setIntervalFn: (handler) => {
        intervalHandler = handler;
        return 1;
      },
      tempoBpm: 120,
    });

    expect(scheduler.start().status).toBe("playing");
    expect(scheduledEvents.map((scheduledEvent) => scheduledEvent.absoluteTick)).toEqual([
      0,
    ]);

    audioTime = 1.95;
    const runInterval = intervalHandler;

    expect(runInterval).toBeDefined();
    runInterval?.();

    expect(scheduledEvents.map((scheduledEvent) => scheduledEvent.absoluteTick)).toEqual([
      0,
      1920,
    ]);
    expect(scheduler.stop().status).toBe("stopped");
    expect(clearCount).toBe(1);
  });
});
