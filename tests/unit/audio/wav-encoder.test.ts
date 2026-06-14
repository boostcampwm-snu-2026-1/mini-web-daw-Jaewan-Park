import { describe, expect, it } from "vitest";

import { encodePcm16WavArrayBuffer } from "../../../src/audio";

describe("wav encoder", () => {
  it("encodes stereo float PCM as 16-bit little-endian WAV", () => {
    const wavBuffer = encodePcm16WavArrayBuffer({
      channelData: [
        new Float32Array([0, 1]),
        new Float32Array([-1, 0.5]),
      ],
      sampleRate: 44100,
    });
    const view = new DataView(wavBuffer);

    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(readAscii(view, 8, 4)).toBe("WAVE");
    expect(readAscii(view, 12, 4)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(34, true)).toBe(16);
    expect(readAscii(view, 36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(8);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(-32768);
    expect(view.getInt16(48, true)).toBe(32767);
    expect(view.getInt16(50, true)).toBe(16384);
  });

  it("rejects mismatched channel lengths", () => {
    expect(() =>
      encodePcm16WavArrayBuffer({
        channelData: [
          new Float32Array([0, 1]),
          new Float32Array([0]),
        ],
        sampleRate: 44100,
      }),
    ).toThrow("All PCM channels must have the same frame count");
  });
});

function readAscii(view: DataView, offset: number, length: number): string {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }

  return value;
}
