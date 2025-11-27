import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64Audio, createAudioBlob } from '../utils/audioUtils';

// Initialize Gemini Client
// In a real app, you might handle the key differently.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSpeech = async (
  text: string, 
  voiceName: string
): Promise<{ audioUrl: string; rawData: Uint8Array }> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set REACT_APP_GEMINI_API_KEY or similar in your environment.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const base64Audio = candidate?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }

    const rawData = decodeBase64Audio(base64Audio);
    const blob = createAudioBlob(rawData);
    const audioUrl = URL.createObjectURL(blob);

    return { audioUrl, rawData };

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};