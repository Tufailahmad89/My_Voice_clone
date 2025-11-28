import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioData?: Uint8Array; // We won't use this for real-time since we play via Blob URL, but purely for show if needed
  // Or we can connect an AudioContext to the audio element.
  audioElementRef: React.RefObject<HTMLAudioElement>;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, audioElementRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElementRef.current || !canvasRef.current) return;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Connect audio element to analyser
      try {
        const source = audioCtx.createMediaElementSource(audioElementRef.current);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (e) {
        // Source might already be connected if component remounts quickly
        console.warn("MediaElementSource connection error", e);
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const analyser = analyserRef.current!;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#3b82f6'); // Blue 500
        gradient.addColorStop(1, '#60a5fa'); // Blue 400

        ctx.fillStyle = gradient;
        // Rounded top bars
        ctx.beginPath();
        
        // Check for roundRect support
        if ('roundRect' in ctx) {
             (ctx as any).roundRect(x, height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        } else {
             ctx.rect(x, height - barHeight, barWidth, barHeight);
        }
        ctx.fill();

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      draw();
    } else {
      if (animationRef.current !== null) {
         cancelAnimationFrame(animationRef.current);
      }
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw a flat line
      ctx.fillStyle = '#334155'; // Slate 700
      ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
    }

    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, audioElementRef]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-24 rounded-lg bg-slate-900/50"
    />
  );
};