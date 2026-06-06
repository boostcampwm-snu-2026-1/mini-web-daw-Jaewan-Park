import type { BundledSampleMeta } from "./types";

const bundledDrumSamplePaths = [
  "/samples/drums/Fred_Clap_1.wav",
  "/samples/drums/Fred_Clap_2.wav",
  "/samples/drums/Fred_Clap_3.wav",
  "/samples/drums/Fred_Closed_Hi-Hat_1.wav",
  "/samples/drums/Fred_Kick_1.wav",
  "/samples/drums/Fred_Kick_2.wav",
  "/samples/drums/Fred_Kick_3.wav",
  "/samples/drums/Fred_Open_Hi-Hat_1.wav",
  "/samples/drums/Fred_Snare_1.wav",
  "/samples/drums/Fred_Snare_2.wav",
  "/samples/drums/Fred_Snare_3.wav",
] as const;

export const BUNDLED_DRUM_SAMPLES = bundledDrumSamplePaths.map((path) => ({
  id: getBundledSampleId(path),
  name: getBundledSampleDisplayName(path),
  path,
})) satisfies readonly BundledSampleMeta[];

export function getBundledSampleDisplayName(path: string): string {
  return getSampleFileStem(path).replaceAll("_", " ").toUpperCase();
}

function getBundledSampleId(path: string): string {
  return getSampleFileStem(path).replaceAll("_", "-").toLowerCase();
}

function getSampleFileStem(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  return fileName.replace(/\.wav$/i, "");
}
