
import React from 'react';
import { useLyrical } from './hooks/useLyrical';
import { LibraryView } from './views/LibraryView';
import { AlbumView } from './views/AlbumView';
import { PlayerView } from './views/PlayerView';
import { MiniPlayer } from './components/MiniPlayer';

export default function App() {
    const {
        files,
        lyrics,
        isPlaying,
        currentTime,
        duration,
        volume,
        isPlayerReady,
        isPlayerExpanded,
        selectedAlbum,
        audioRef,
        scrollContainerRef,
        playingTrackIdRef,
        playingAlbumIdRef,
        SAFE_LIBRARY,
        backgroundStyle,
        togglePlay,
        handleSeek,
        handleVolume,
        onTimeUpdate,
        onLoadedMetadata,
        onEnded,
        handleNext,
        handlePrevious,
        hasNext,
        hasPrevious,
        navigateToAlbum,
        navigateToLibrary,
        playTrackFromLibrary,
        closePlayer,
        setIsPlayerExpanded
    } = useLyrical();

    return (
        <>
            <audio
                ref={audioRef}
                src={files.audioUrl || undefined}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
                onError={(e) => {
                    const errorMsg = e.currentTarget.error?.message || "Unknown Audio Error";
                    console.warn(`Audio playback error: ${errorMsg}`);
                }}
            />

            {!isPlayerExpanded && (
                <div
                    ref={scrollContainerRef}
                    className="relative h-[100dvh] w-full flex flex-col items-center p-4 md:p-12 lg:p-16 bg-gray-950 overflow-y-auto custom-scrollbar pb-40"
                >
                    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="z-10 w-full max-w-6xl animate-in fade-in zoom-in duration-700 my-4 md:my-8 flex flex-col items-center">
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 mb-4">
                                {import.meta.env.VITE_SITE_NAME || "Lyrical Player"}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-400 font-light tracking-wide">
                                {import.meta.env.VITE_SITE_DESC || "Play your collection of tracks synced with lrc files in a neat, web based format." }
                            </p>
                        </div>

                        <div className="w-full">
                            {!selectedAlbum ? (
                                <LibraryView albums={SAFE_LIBRARY} navigateToAlbum={navigateToAlbum} />
                            ) : (
                                <AlbumView
                                    album={selectedAlbum}
                                    navigateToLibrary={navigateToLibrary}
                                    playTrackFromLibrary={playTrackFromLibrary}
                                    playingAlbumId={playingAlbumIdRef.current}
                                    playingTrackId={playingTrackIdRef.current}
                                    isPlaying={isPlaying}
                                />
                            )}
                        </div>
                        {/* Footer */}
                        <footer className="w-full py-6 text-center border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                          <p className="text-slate-500 text-sm">
                            Open Source Project. View source on{' '}
                            <a 
                              href="https://github.com/xiliourt/Lyrical-Sync" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-purple-400 hover:text-purple-300 hover:underline transition-colors font-medium"
                            >
                              GitHub
                            </a>
                          </p>
                        </footer>
                    </div>

                    {!isPlayerExpanded && isPlayerReady && files.audioFileName && (
                        <MiniPlayer files={files} isPlaying={isPlaying} onExpand={() => setIsPlayerExpanded(true)} />
                    )}
                </div>
            )}

            {isPlayerExpanded && (
                <PlayerView
                    files={files}
                    lyrics={lyrics}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                    backgroundStyle={backgroundStyle}
                    closePlayer={closePlayer}
                    togglePlay={togglePlay}
                    handleSeek={handleSeek}
                    handleVolume={handleVolume}
                    handleNext={handleNext}
                    handlePrevious={handlePrevious}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                />
            )}
        </>
    );
}
