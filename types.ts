export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  description: string;
  isCustom?: boolean;
}

export interface AudioClip {
  id: string;
  text: string;
  voiceId: string;
  audioUrl: string; // Blob URL
  createdAt: number;
  duration?: number;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Warm and soothing' },
  { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Energetic and clear' },
  { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Deep and authoritative' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Rough and intense' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female', description: 'Soft and gentle' },
];