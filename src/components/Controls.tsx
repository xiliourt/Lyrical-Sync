import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../utils/lrcParser';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  variant?: 'desktop' | 'mobile';
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  variant = 'desktop'
}) => {
  const isMobile = variant === 'mobile';

  return (
    <div className={`w-full ${isMobile ? 'flex flex-col gap-2' : 'space-y-6'}`}>
      
      {/* Progress Bar */}
      <div className={`group relative w-full flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
        <span className="text-xs text-gray-400 w-10 text-right font-mono select-none">{formatTime(currentTime)}</span>
        
        <div className={`relative flex-1 bg-gray-700/50 rounded-full cursor-pointer transition-all ${isMobile ? 'h-1' : 'h-1.5 group-hover:h-2.5'}`}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div 
            className="h-full bg-white rounded-full relative"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg transition-opacity ${isMobile ? 'w-2 h-2 opacity-100' : 'w-3 h-3 opacity-0 group-hover:opacity-100'}`} />
          </div>
        </div>

        <span className="text-xs text-gray-400 w-10 font-mono select-none">{formatTime(duration)}</span>
      </div>

      {/* Buttons Row */}
      <div className={`flex items-center justify-between ${isMobile ? 'px-2 pb-2' : ''}`}>
        
        {/* Left Side (Empty on Mobile, Spacer on Desktop) */}
        <div className="flex-1"></div>

        {/* Center Controls */}
        <div className={`flex items-center ${isMobile ? 'gap-8' : 'gap-8'}`}>
          <button 
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`text-gray-400 hover:text-white transition-colors active:scale-95 ${!hasPrevious ? 'opacity-30 cursor-default hover:text-gray-400 active:scale-100' : ''}`}
          >
            <SkipBack size={isMobile ? 24 : 28} />
          </button>
          
          <button 
            onClick={onPlayPause}
            className={`flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
          >
            {isPlaying ? <Pause size={isMobile ? 24 : 32} fill="currentColor" /> : <Play size={isMobile ? 24 : 32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={onNext}
            disabled={!hasNext}
            className={`text-gray-400 hover:text-white transition-colors active:scale-95 ${!hasNext ? 'opacity-30 cursor-default hover:text-gray-400 active:scale-100' : ''}`}
          >
            <SkipForward size={isMobile ? 24 : 28} />
          </button>
        </div>

        {/* Right Side (Volume - Hidden on Mobile) */}
        <div className="flex-1 flex justify-end items-center gap-2 group">
           {!isMobile && (
             <>
               <button onClick={() => onVolumeChange(volume === 0 ? 1 : 0)} className="text-gray-400 hover:text-white">
                 {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
               </button>
               <div className="w-24 h-1.5 bg-gray-700/50 rounded-full relative cursor-pointer">
                  <div 
                     className="absolute h-full bg-gray-400 group-hover:bg-white transition-colors rounded-full"
                     style={{ width: `${volume * 100}%` }}
                  />
                   <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};
