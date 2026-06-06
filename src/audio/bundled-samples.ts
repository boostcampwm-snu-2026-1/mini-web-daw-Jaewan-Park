import type { BundledSampleMeta } from "./types";

const bundledDrumSamplePaths = [
  "/samples/drums/Fred_Clap_1.wav",
  "/samples/drums/Fred_Clap_2.wav",
  "/samples/drums/Fred_Clap_3.wav",
  "/samples/drums/Fred_Closed_Hi-Hat.wav",
  "/samples/drums/Fred_Kick_1.wav",
  "/samples/drums/Fred_Kick_2.wav",
  "/samples/drums/Fred_Kick_3.wav",
  "/samples/drums/Fred_Open_Hi-Hat.wav",
  "/samples/drums/Fred_Snare_1.wav",
  "/samples/drums/Fred_Snare_2.wav",
  "/samples/drums/Fred_Snare_3.wav",
] as const;

const bundledPianoSamplePaths = [
  "/samples/pitched_instruments/Iowa_Piano/C4.wav",
  "/samples/pitched_instruments/Iowa_Piano/Db4.wav",
  "/samples/pitched_instruments/Iowa_Piano/D4.wav",
  "/samples/pitched_instruments/Iowa_Piano/Eb4.wav",
  "/samples/pitched_instruments/Iowa_Piano/E4.wav",
  "/samples/pitched_instruments/Iowa_Piano/F4.wav",
  "/samples/pitched_instruments/Iowa_Piano/Gb4.wav",
  "/samples/pitched_instruments/Iowa_Piano/G4.wav",
  "/samples/pitched_instruments/Iowa_Piano/Ab4.wav",
  "/samples/pitched_instruments/Iowa_Piano/A4.wav",
  "/samples/pitched_instruments/Iowa_Piano/Bb4.wav",
  "/samples/pitched_instruments/Iowa_Piano/B4.wav",
  "/samples/pitched_instruments/Iowa_Piano/C5.wav",
] as const;

export const BUNDLED_DRUM_SAMPLES = bundledDrumSamplePaths.map((path) => ({
  id: getBundledSampleId(path),
  name: getBundledSampleDisplayName(path),
  path,
})) satisfies readonly BundledSampleMeta[];

export const BUNDLED_PIANO_SAMPLES = bundledPianoSamplePaths.map((path) => {
  const noteName = getSampleFileStem(path);

  return {
    id: `iowa-piano-${noteName.toLowerCase()}`,
    name: `IOWA PIANO ${noteName.toUpperCase()}`,
    path,
  };
}) satisfies readonly BundledSampleMeta[];

export const BUNDLED_SAMPLES = [
  ...BUNDLED_DRUM_SAMPLES,
  ...BUNDLED_PIANO_SAMPLES,
] satisfies readonly BundledSampleMeta[];

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
