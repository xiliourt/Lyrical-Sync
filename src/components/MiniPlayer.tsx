
import React from 'react';
import { MediaFiles } from '../types';

const DEFAULT_COVER = "/favicon.png";

interface MiniPlayerProps {
    files: MediaFiles;
    isPlaying: boolean;
    onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ files, isPlaying, onExpand }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in">
            <button
                onClick={onExpand}
                className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-full pl-3 pr-6 py-2 shadow-2xl hover:scale-105 transition-transform"
            >
                <div className={`w-10 h-10 rounded-full overflow-hidden relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <img src={files.coverUrl || DEFAULT_COVER} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-white max-w-[150px] truncate">{files.audioFileName}</p>
                    <p className="text-xs text-gray-400">{files.artist}</p>
                </div>
                <div className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </button>
        </div>
    );
};
