interface DecodedPcmWav {
  channelData: Float32Array[];
  sampleRate: number;
}

export async function decodeAudioBuffer({
  arrayBuffer,
  audioContext,
  errorMessage,
}: {
  arrayBuffer: ArrayBuffer;
  audioContext: BaseAudioContext;
  errorMessage: string;
}): Promise<AudioBuffer> {
  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } catch (decodeError) {
    const decodedPcmWav = decodePcmWav(arrayBuffer);

    if (!decodedPcmWav) {
      throw decodeError instanceof Error
        ? new Error(errorMessage, { cause: decodeError })
        : new Error(errorMessage);
    }

    const audioBuffer = audioContext.createBuffer(
      decodedPcmWav.channelData.length,
      decodedPcmWav.channelData[0]?.length ?? 0,
      decodedPcmWav.sampleRate,
    );

    decodedPcmWav.channelData.forEach((channelData, channelIndex) => {
      audioBuffer.copyToChannel(new Float32Array(channelData), channelIndex);
    });

    return audioBuffer;
  }
}

function decodePcmWav(arrayBuffer: ArrayBuffer): DecodedPcmWav | null {
  const view = new DataView(arrayBuffer);

  if (
    arrayBuffer.byteLength < 44 ||
    readAscii(view, 0, 4) !== "RIFF" ||
    readAscii(view, 8, 4) !== "WAVE"
  ) {
    return null;
  }

  let audioFormat = 0;
  let bitsPerSample = 0;
  let blockAlign = 0;
  let channelCount = 0;
  let dataOffset = 0;
  let dataSize = 0;
  let sampleRate = 0;
  let offset = 12;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;

    if (chunkStart + chunkSize > view.byteLength) {
      return null;
    }

    if (chunkId === "fmt ") {
      audioFormat = view.getUint16(chunkStart, true);
      channelCount = view.getUint16(chunkStart + 2, true);
      sampleRate = view.getUint32(chunkStart + 4, true);
      blockAlign = view.getUint16(chunkStart + 12, true);
      bitsPerSample = view.getUint16(chunkStart + 14, true);
    }

    if (chunkId === "data") {
      dataOffset = chunkStart;
      dataSize = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  const isPcm = audioFormat === 1 || audioFormat === 65534;
  const bytesPerSample = bitsPerSample / 8;

  if (
    !isPcm ||
    !Number.isInteger(bytesPerSample) ||
    ![2, 3, 4].includes(bytesPerSample) ||
    blockAlign <= 0 ||
    channelCount <= 0 ||
    dataOffset <= 0 ||
    dataSize <= 0 ||
    sampleRate <= 0
  ) {
    return null;
  }

  const frameCount = Math.floor(dataSize / blockAlign);
  const channelData = Array.from(
    { length: channelCount },
    () => new Float32Array(frameCount),
  );

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const frameOffset = dataOffset + frameIndex * blockAlign;

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sampleOffset = frameOffset + channelIndex * bytesPerSample;

      channelData[channelIndex][frameIndex] = readPcmSample(
        view,
        sampleOffset,
        bytesPerSample,
      );
    }
  }

  return {
    channelData,
    sampleRate,
  };
}

function readPcmSample(
  view: DataView,
  sampleOffset: number,
  bytesPerSample: number,
): number {
  if (bytesPerSample === 2) {
    return view.getInt16(sampleOffset, true) / 32768;
  }

  if (bytesPerSample === 3) {
    let value =
      view.getUint8(sampleOffset) |
      (view.getUint8(sampleOffset + 1) << 8) |
      (view.getUint8(sampleOffset + 2) << 16);

    if (value & 0x800000) {
      value |= 0xff000000;
    }

    return value / 8388608;
  }

  return view.getInt32(sampleOffset, true) / 2147483648;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }

  return value;
}
