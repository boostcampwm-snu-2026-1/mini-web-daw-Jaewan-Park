export interface PcmWavEncodingOptions {
  channelData: readonly Float32Array[];
  sampleRate: number;
}

const WAV_HEADER_BYTES = 44;
const PCM_FORMAT = 1;
const PCM_16_BIT_BYTES_PER_SAMPLE = 2;

export function encodePcm16WavBlob(options: PcmWavEncodingOptions): Blob {
  return new Blob([encodePcm16WavArrayBuffer(options)], {
    type: "audio/wav",
  });
}

export function encodePcm16WavArrayBuffer({
  channelData,
  sampleRate,
}: PcmWavEncodingOptions): ArrayBuffer {
  validateEncodingOptions({ channelData, sampleRate });

  const channelCount = channelData.length;
  const frameCount = channelData[0]?.length ?? 0;
  const blockAlign = channelCount * PCM_16_BIT_BYTES_PER_SAMPLE;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = frameCount * blockAlign;
  const arrayBuffer = new ArrayBuffer(WAV_HEADER_BYTES + dataByteLength);
  const view = new DataView(arrayBuffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataByteLength, true);

  let byteOffset = WAV_HEADER_BYTES;

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = clampPcmSample(channelData[channelIndex]?.[frameIndex] ?? 0);
      const pcmValue = sample < 0 ? sample * 32768 : sample * 32767;

      view.setInt16(byteOffset, Math.round(pcmValue), true);
      byteOffset += PCM_16_BIT_BYTES_PER_SAMPLE;
    }
  }

  return arrayBuffer;
}

function validateEncodingOptions({
  channelData,
  sampleRate,
}: PcmWavEncodingOptions): void {
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error(`sampleRate must be a positive integer. Received ${sampleRate}.`);
  }

  if (channelData.length <= 0) {
    throw new Error("At least one PCM channel is required.");
  }

  const frameCount = channelData[0]?.length;

  if (frameCount === undefined) {
    throw new Error("At least one PCM channel is required.");
  }

  for (const [channelIndex, channel] of channelData.entries()) {
    if (channel.length !== frameCount) {
      throw new Error(
        `All PCM channels must have the same frame count. Channel 0 has ${frameCount}, channel ${channelIndex} has ${channel.length}.`,
      );
    }
  }
}

function clampPcmSample(sample: number): number {
  if (!Number.isFinite(sample)) {
    return 0;
  }

  return Math.min(1, Math.max(-1, sample));
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
