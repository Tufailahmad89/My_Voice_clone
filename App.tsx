import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AVAILABLE_VOICES, GenerationStatus, AudioClip, VoiceOption } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { generateSpeech } from './services/gemini';
import { AudioVisualizer } from './components/AudioVisualizer';
import { 
  Wand2, 
  Play, 
  Pause, 
  Download, 
  History, 
  Trash2, 
  Loader2,
  Mic,
  Volume2,
  User
} from 'lucide-react';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0].id);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [history, setHistory] = useState<AudioClip[]>([]);
  const [currentClip, setCurrentClip] = useState<AudioClip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine standard and custom voices
  const allVoices = useMemo(() => [...AVAILABLE_VOICES, ...customVoices], [customVoices]);

  // Auto scroll history
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const handleCreateVoice = (newVoice: VoiceOption) => {
    setCustomVoices(prev => [...prev, newVoice]);
    setSelectedVoice(newVoice.id);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setStatus(GenerationStatus.GENERATING);
    setError(null);
    
    try {
      // Logic to determine which voice name to send to API
      // If it's a custom voice, we map it to a similar gender pre-built voice 
      // because we are mocking the cloning endpoint for this demo.
      const voiceObj = allVoices.find(v => v.id === selectedVoice);
      let apiVoiceName = voiceObj?.name || 'Kore';

      if (voiceObj?.isCustom) {
        // Fallback mapping for custom voices
        apiVoiceName = voiceObj.gender === 'Female' ? 'Kore' : 'Puck';
      }

      // We still pass the requested voice ID to history so the UI shows the custom name
      const { audioUrl } = await generateSpeech(text, apiVoiceName);
      
      const newClip: AudioClip = {
        id: crypto.randomUUID(),
        text: text,
        voiceId: selectedVoice, // Store the actual selected ID (could be custom)
        audioUrl: audioUrl,
        createdAt: Date.now()
      };

      setHistory(prev => [...prev, newClip]);
      setCurrentClip(newClip);
      
      // Auto play
      setTimeout(() => {
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play().catch(e => console.warn("Auto-play blocked", e));
        }
      }, 100);

      setText(''); 
    } catch (e) {
      setError("Failed to generate speech. Please try again. Ensure API Key is set.");
      console.error(e);
    } finally {
      setStatus(GenerationStatus.IDLE);
    }
  };

  const handlePlayClip = (clip: AudioClip) => {
    if (currentClip?.id === clip.id && isPlaying) {
        audioRef.current?.pause();
        return;
    }
    
    setCurrentClip(clip);
    if (audioRef.current) {
        audioRef.current.src = clip.audioUrl;
        audioRef.current.play();
    }
  };

  const handleDeleteClip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(c => c.id !== id));
    if (currentClip?.id === id) {
        setCurrentClip(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    }
  };

  const activeVoiceName = allVoices.find(v => v.id === selectedVoice)?.name;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
        
        {/* Hidden Audio Element */}
        <audio 
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
            crossOrigin="anonymous" 
        />

        {/* Header */}
        <header className="w-full max-w-5xl mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 flex items-center gap-3">
                    <Mic className="text-blue-500" />
                    Voice clone
                </h1>
               
               
            </div>
           
        </header>

        <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Panel: Controls */}
            <div className="lg:col-span-7 space-y-8">
                
                {/* Voice Selection */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <User size={20} className="text-blue-400" />
                            Select Voice
                        </h2>
                    </div>
                    <VoiceSelector 
                        voices={allVoices}
                        selectedVoice={selectedVoice} 
                        onSelect={setSelectedVoice}
                        onCreateVoice={handleCreateVoice}
                        disabled={status === GenerationStatus.GENERATING}
                    />
                </section>

                {/* Text Input */}
                <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 focus-within:border-blue-500/50 transition-colors">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Wand2 size={20} className="text-purple-400" />
                        Script
                    </h2>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Type something amazing for ${activeVoiceName || 'Gemini'} to say...`}
                        className="w-full h-40 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-medium leading-relaxed"
                        disabled={status === GenerationStatus.GENERATING}
                    />
                    
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-slate-500 font-medium">
                            {text.length} characters
                        </span>
                        <button
                            onClick={handleGenerate}
                            disabled={!text.trim() || status === GenerationStatus.GENERATING}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all
                                ${!text.trim() || status === GenerationStatus.GENERATING
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 active:scale-95'}
                            `}
                        >
                            {status === GenerationStatus.GENERATING ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 size={18} />
                                    Generate Audio
                                </>
                            )}
                        </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </section>

                {/* Current Playback Visualizer */}
                <section className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
                     <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Volume2 size={20} className="text-emerald-400" />
                            Now Playing
                        </h2>
                        {currentClip && (
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded">
                                {allVoices.find(v => v.id === currentClip.voiceId)?.name || 'Unknown Voice'}
                            </span>
                        )}
                    </div>
                    
                    <AudioVisualizer isPlaying={isPlaying} audioElementRef={audioRef} />

                    <div className="mt-4 flex items-center justify-center text-slate-400 text-sm">
                        {isPlaying ? "Playing..." : "Ready"}
                    </div>
                </section>

            </div>

            {/* Right Panel: History */}
            <div className="lg:col-span-5 h-full">
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 h-[600px] flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <History size={20} className="text-orange-400" />
                            Generation History
                        </h2>
                        <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded-full text-slate-400">
                            {history.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {history.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <Mic size={48} className="mb-4 opacity-20" />
                                <p>No audio generated yet.</p>
                            </div>
                        ) : (
                            history.map((clip) => {
                                const isClipPlaying = currentClip?.id === clip.id && isPlaying;
                                const voice = allVoices.find(v => v.id === clip.voiceId);
                                
                                return (
                                    <div 
                                        key={clip.id}
                                        className={`
                                            group p-4 rounded-xl border transition-all duration-200 cursor-pointer
                                            ${currentClip?.id === clip.id 
                                                ? 'bg-blue-900/20 border-blue-800/50' 
                                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'}
                                        `}
                                        onClick={() => handlePlayClip(clip)}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <button 
                                                className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all
                                                    ${isClipPlaying 
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                                        : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'}
                                                `}
                                            >
                                                {isClipPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                                            </button>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        {voice?.name}
                                                        {voice?.isCustom && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block ml-0.5"></span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(clip.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                                                    {clip.text}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a 
                                                    href={clip.audioUrl} 
                                                    download={`my-voice${clip.id}.wav`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button 
                                                    onClick={(e) => handleDeleteClip(clip.id, e)}
                                                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
};

export default App;
