import React, { useState, useRef } from 'react';
import { VoiceOption } from '../types';
import { Check, User, Music, Plus, Upload, X, Mic } from 'lucide-react';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  onCreateVoice: (voice: VoiceOption) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ 
  voices, 
  selectedVoice, 
  onSelect, 
  onCreateVoice,
  disabled 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceGender, setNewVoiceGender] = useState<'Male' | 'Female'>('Male');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoiceName || !file) return;

    const newVoice: VoiceOption = {
      id: crypto.randomUUID(),
      name: newVoiceName,
      gender: newVoiceGender,
      description: 'Custom cloned voice',
      isCustom: true
    };

    onCreateVoice(newVoice);
    
    // Reset form
    setIsCreating(false);
    setNewVoiceName('');
    setFile(null);
    setNewVoiceGender('Male');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Existing Voices */}
      {voices.map((voice) => {
        const isSelected = selectedVoice === voice.id;
        return (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            disabled={disabled}
            className={`
              relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left
              ${isSelected 
                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {voice.isCustom ? <Mic size={18} /> : (voice.gender === 'Male' ? <User size={18} /> : <Music size={18} />)}
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {voice.name}
                  </span>
                  {voice.isCustom && (
                    <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-1.5 rounded w-fit">
                      CLONED
                    </span>
                  )}
                </div>
              </div>
              {isSelected && <Check size={18} className="text-blue-400" />}
            </div>
            
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
              {voice.gender} Voice
            </p>
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
              {voice.description}
            </p>
          </button>
        );
      })}

      {/* Create New Voice Card */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-200 min-h-[140px] group"
        >
          <div className="p-3 rounded-full bg-slate-800 group-hover:bg-blue-500/20 mb-3 transition-colors">
            <Plus size={24} className="text-slate-400 group-hover:text-blue-400" />
          </div>
          <span className="font-semibold text-slate-300 group-hover:text-white">Clone a Voice</span>
          <span className="text-xs text-slate-500 mt-1">Upload a sample</span>
        </button>
      ) : (
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 p-4 rounded-xl border border-blue-500/30 bg-slate-900/80 backdrop-blur-sm relative">
          <button 
            onClick={() => setIsCreating(false)}
            className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
          >
            <X size={16} />
          </button>
          
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Mic size={16} className="text-blue-400" />
            Clone Voice
          </h3>
          
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Voice Name (e.g. My Clone)"
                value={newVoiceName}
                onChange={(e) => setNewVoiceName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              {(['Male', 'Female'] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setNewVoiceGender(g)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${
                    newVoiceGender === g 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-2 px-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs transition-colors ${
                    file 
                    ? 'border-green-500/50 bg-green-500/10 text-green-400' 
                    : 'border-slate-600 hover:border-slate-500 text-slate-400'
                }`}
              >
                {file ? (
                    <>
                        <Check size={14} />
                        {file.name.substring(0, 15)}...
                    </>
                ) : (
                    <>
                        <Upload size={14} />
                        Upload Sample (10s)
                    </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={!newVoiceName || !file}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
            >
              Create Persona
            </button>
          </form>
        </div>
      )}
    </div>
  );
};