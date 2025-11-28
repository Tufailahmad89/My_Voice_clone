import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64Audio, createAudioBlob } from '../utils/audioUtils';

export const generateSpeech = async (
  text: string, 
  voiceName: string
): Promise<{ audioUrl: string; rawData: Uint8Array }> => {
  
  // Safely retrieve the API key to avoid "ReferenceError: process is not defined" in some browser bundlers
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore reference errors for process
    console.warn("process.env is not accessible");
  }

  // NOTE: If you are using Vite, you might need to use import.meta.env.VITE_API_KEY
  // If you are using Next.js, you might need process.env.NEXT_PUBLIC_API_KEY
  // For this template, we stick to the standard process.env.API_KEY pattern.
  
  if (!apiKey) {
    throw new Error("API Key is missing. Ensure 'API_KEY' is set in your environment variables (or VITE_API_KEY for Vite deployments).");
  }

  const ai = new GoogleGenAI({ apiKey });

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
      throw new Error("No audio data received from Gemini. The model might be busy or the prompt filtered.");
    }

    const rawData = decodeBase64Audio(base64Audio);
    const blob = createAudioBlob(rawData);
    const audioUrl = URL.createObjectURL(blob);

    return { audioUrl, rawData };

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    // Re-throw with a clean message if possible
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw error;
  }
};