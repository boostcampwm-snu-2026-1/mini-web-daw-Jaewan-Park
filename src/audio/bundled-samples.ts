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
  "/samples/pitched_instruments/University_of_Iowa_piano/C4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/Db4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/D4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/Eb4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/E4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/F4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/Gb4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/G4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/Ab4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/A4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/Bb4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/B4.wav",
  "/samples/pitched_instruments/University_of_Iowa_piano/C5.wav",
] as const;

export const BUNDLED_DRUM_SAMPLES = bundledDrumSamplePaths.map((path) => ({
  id: getBundledSampleId(path),
  name: getBundledSampleDisplayName(path),
  path,
})) satisfies readonly BundledSampleMeta[];

export const BUNDLED_PIANO_SAMPLES = bundledPianoSamplePaths.map((path) => {
  const noteName = getSampleFileStem(path);

  return {
    id: `university-of-iowa-piano-${noteName.toLowerCase()}`,
    name: `UNIVERSITY OF IOWA PIANO ${noteName.toUpperCase()}`,
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
