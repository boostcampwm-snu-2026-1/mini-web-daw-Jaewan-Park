import type { BundledSampleMeta } from "./types";

export const BUNDLED_DRUM_SAMPLES = [
  {
    id: "kick",
    name: "Kick",
    path: "/samples/drums/kick.wav",
  },
  {
    id: "snare",
    name: "Snare",
    path: "/samples/drums/snare.wav",
  },
  {
    id: "closed-hat",
    name: "Closed hi-hat",
    path: "/samples/drums/closed-hat.wav",
  },
  {
    id: "open-hat",
    name: "Open hi-hat",
    path: "/samples/drums/open-hat.wav",
  },
] as const satisfies readonly BundledSampleMeta[];
