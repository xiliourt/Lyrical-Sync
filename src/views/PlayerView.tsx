
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Controls } from '../components/Controls';
import { LyricsContainer } from '../components/LyricsContainer';
import { MediaFiles, LyricLine } from '../types';

const DEFAULT_COVER = "/favicon.png";

interface PlayerViewProps {
    files: MediaFiles;
    lyrics: LyricLine[];
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    backgroundStyle: React.CSSProperties;
    closePlayer: () => void;
    togglePlay: () => void;
    handleSeek: (time: number) => void;
    handleVolume: (volume: number) => void;
    handleNext: () => void;
    handlePrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
    files,
    lyrics,
    isPlaying,
    currentTime,
    duration,
    volume,
    backgroundStyle,
    closePlayer,
    togglePlay,
    handleSeek,
    handleVolume,
    handleNext,
    handlePrevious,
    hasNext,
    hasPrevious,
}) => {

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = DEFAULT_COVER;
        e.currentTarget.onerror = null; 
    };

    return (
        <div className="fixed inset-0 z-40 bg-gray-900 text-white flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-[2s] scale-110 blur-[60px] md:blur-[80px] opacity-40 md:opacity-50 z-0 pointer-events-none"
                style={backgroundStyle}
            />
            <div className="absolute inset-0 bg-black/50 md:bg-black/40 z-0 pointer-events-none" />

            <div className="md:hidden absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={closePlayer}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-md active:bg-white/20 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 mx-4 text-center">
                    <h3 className="font-bold text-sm truncate drop-shadow-md">{files.audioFileName || "Now Playing"}</h3>
                </div>
                <div className="w-9" />
            </div>

            <div className="hidden md:flex w-1/2 lg:w-[45%] h-full flex-col justify-center items-center p-8 lg:p-12 relative z-10">
                <div className="w-full max-w-md flex flex-col gap-6 lg:gap-10 h-full justify-center">
                    <button
                        onClick={closePlayer}
                        className="self-start flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/10 border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft size={16} /> Library
                    </button>

                    <div className="relative aspect-square w-full shrink-0 max-h-[50vh] rounded-3xl shadow-2xl overflow-hidden border border-white/10 group mx-auto">
                        <img
                            src={files.coverUrl || DEFAULT_COVER}
                            alt="Album Cover"
                            onError={handleImageError}
                            className={`object-cover`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-bold truncate tracking-tight">{files.audioFileName || "Unknown Track"}</h2>
                            <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
                                {files.artist || "Unknown Artist"}
                            </p>
                        </div>

                        <Controls
                            variant="desktop"
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            volume={volume}
                            onPlayPause={togglePlay}
                            onSeek={handleSeek}
                            onVolumeChange={handleVolume}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            hasNext={hasNext}
                            hasPrevious={hasPrevious}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 h-full relative z-10 flex flex-col">
                <div className="flex-1 relative overflow-hidden">
                    <div className="md:hidden absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none z-0" />
                    <LyricsContainer
                        lyrics={lyrics}
                        currentTime={currentTime}
                        isLoaded={!!files.lrcContent}
                        onLineClick={handleSeek}
                    />
                </div>

                <div className="md:hidden p-6 pb-12 bg-black/40 backdrop-blur-xl border-t border-white/10 z-30">
                    <Controls
                        variant="mobile"
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        duration={duration}
                        volume={volume}
                        onPlayPause={togglePlay}
                        onSeek={handleSeek}
                        onVolumeChange={handleVolume}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        hasNext={hasNext}
                        hasPrevious={hasPrevious}
                    />
                </div>
            </div>
        </div>
    );
};
