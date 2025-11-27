export const decodeBase64Audio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const createAudioBlob = (bytes: Uint8Array): Blob => {
  // Create a Blob from the PCM data. 
  // Note: Gemini returns raw PCM. To play it in a standard <audio> tag, 
  // we typically need a WAV header or use AudioContext to play the buffer directly.
  // For simplicity in this demo to allow download/playback via URL, 
  // we will wrap it in a WAV container if possible, or use the AudioContext approach for playback in app.
  // However, `URL.createObjectURL` requires a valid file format (like WAV/MP3) to work with <audio src="..."> properly 
  // without MediaSource extensions.
  
  // Since Gemini output is raw PCM (usually 24kHz, mono), we will construct a simple WAV header.
  return encodeWAV(bytes, 24000, 1);
};

// Helper to add WAV header to raw PCM data
const encodeWAV = (samples: Uint8Array, sampleRate: number, numChannels: number): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * 2, true); // 16-bit
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length, true);

  // Write PCM samples
  // The samples from Gemini are raw bytes, assuming 16-bit PCM little-endian.
  // We can just copy the Uint8Array directly after the header.
  const audioData = new Uint8Array(buffer, 44);
  audioData.set(samples);

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};