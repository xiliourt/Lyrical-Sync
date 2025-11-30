import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Play, Disc, ListMusic, Library as LibraryIcon } from 'lucide-react';
import { LyricsContainer } from './components/LyricsContainer';
import { Controls } from './components/Controls';
import { parseLrc } from './utils/lrcParser';
import { MediaFiles, LyricLine, Album, Track } from './types';
import { LIBRARY } from './playlist';

const DEFAULT_COVER = "/favicon.png"; 

// Ensure Library is an array even if import fails or is undefined
const SAFE_LIBRARY = Array.isArray(LIBRARY) ? LIBRARY : [];

export default function App() {
  const [files, setFiles] = useState<MediaFiles>({
    audioUrl: null,
    lrcContent: null,
    coverUrl: null,
    audioFileName: null,
    artist: null
  });
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  
  // Library Navigation State
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Playback Queue State
  const [playingAlbum, setPlayingAlbum] = useState<Album | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  
  // Refs to track current playback state without triggering re-renders in effects
  const playingTrackIdRef = useRef<string | null>(null);
  const playingAlbumIdRef = useRef<string | null>(null);
  
  // Ref for main scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper to load track data specifically
  const loadTrack = useCallback(async (track: Track, album: Album) => {
    try {
      // Update Refs immediately
      playingTrackIdRef.current = track.id;
      playingAlbumIdRef.current = album.id;

      // Fetch LRC content
      let lrcText = "";
      try {
        const res = await fetch(track.lrcSrc);
        if (res.ok) {
          lrcText = await res.text();
        } else {
            console.warn(`LRC file not found at ${track.lrcSrc}`);
        }
      } catch (e) {
        console.warn("Could not load lyrics for track", track.title);
      }

      setFiles(prev => {
        // Revoke previous blobs if they exist
        if (prev.audioUrl && prev.audioUrl.startsWith('blob:')) URL.revokeObjectURL(prev.audioUrl);
        if (prev.coverUrl && prev.coverUrl.startsWith('blob:')) URL.revokeObjectURL(prev.coverUrl);
        
        return {
          audioUrl: track.audioSrc,
          coverUrl: album.coverSrc,
          lrcContent: lrcText,
          audioFileName: track.title,
          artist: album.artist
        };
      });

      setLyrics(parseLrc(lrcText));
      setIsPlayerReady(true);
      
      // Auto play after a short delay to allow render
      setTimeout(() => {
        if (audioRef.current) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(e => console.warn("Auto-play blocked", e));
        }
      }, 100);

    } catch (e) {
      console.error("Error loading track", e);
      alert("Could not load this track. Please check if the files exist in the public folder.");
    }
  }, []);

  // Update Document Title based on state
  useEffect(() => {
    if (playingAlbum && currentTrackIndex !== -1) {
      // Player View
      const track = playingAlbum.tracks[currentTrackIndex];
      document.title = track.title;
    } else if (selectedAlbum) {
      // Album View
      document.title = selectedAlbum.title;
    } else {
      // Library View
      document.title = "Lyrical Player";
    }
  }, [playingAlbum, currentTrackIndex, selectedAlbum]);

  // Sync state with URL path
  useEffect(() => {
    const syncWithUrl = () => {
      // Parse path: /album-id/track-id
      const path = window.location.pathname;
      const segments = path.split('/').filter(p => p && p !== '');
      
      const albumId = segments[0];
      const trackId = segments[1];

      if (albumId) {
        const foundAlbum = SAFE_LIBRARY.find(a => a.id === albumId);
        if (foundAlbum) {
          setSelectedAlbum(foundAlbum);
          
          if (trackId) {
             // We have a track in URL, so show the player
             setIsPlayerExpanded(true);

             // Check if we are ALREADY playing this track
             if (playingTrackIdRef.current === trackId && playingAlbumIdRef.current === albumId) {
                 // Do not reload, just ensure state is correct
                 return;
             }

             const trackIndex = foundAlbum.tracks.findIndex(t => t.id === trackId);
             if (trackIndex !== -1) {
                setPlayingAlbum(foundAlbum);
                setCurrentTrackIndex(trackIndex);
                loadTrack(foundAlbum.tracks[trackIndex], foundAlbum);
             }
          } else {
             // Album view, no track
             setIsPlayerExpanded(false);
          }
        } else {
           // Invalid album ID in path, reset
           setSelectedAlbum(null);
           setIsPlayerExpanded(false);
        }
      } else {
        setSelectedAlbum(null);
        setIsPlayerExpanded(false);
      }
    };

    syncWithUrl(); // Initial check
    window.addEventListener('popstate', syncWithUrl);
    return () => window.removeEventListener('popstate', syncWithUrl);
  }, [loadTrack]);

  const updateUrl = (albumId?: string, trackId?: string, replace = false) => {
    let url = '/';
    if (albumId) {
      url += albumId;
      if (trackId) {
        url += '/' + trackId;
      }
    }

    if (replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
  };

  const navigateToAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setIsPlayerExpanded(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    updateUrl(album.id);
  };

  const navigateToLibrary = () => {
    setSelectedAlbum(null);
    setIsPlayerExpanded(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    updateUrl();
  };

  // Called when user clicks a track in the library
  const playTrackFromLibrary = (track: Track, album: Album) => {
    setIsPlayerExpanded(true);
    
    // If clicking the currently playing track, just expand player and don't reload
    if (playingTrackIdRef.current === track.id && playingAlbumIdRef.current === album.id) {
        updateUrl(album.id, track.id);
        return;
    }

    setPlayingAlbum(album);
    const index = album.tracks.findIndex(t => t.id === track.id);
    setCurrentTrackIndex(index);
    loadTrack(track, album);
    // Push state so back button works to go back to previous song or state
    updateUrl(album.id, track.id);
  };

  // Navigation Logic
  const hasNext = useMemo(() => {
    if (!playingAlbum) return false;
    return currentTrackIndex < playingAlbum.tracks.length - 1;
  }, [playingAlbum, currentTrackIndex]);

  const hasPrevious = useMemo(() => {
    // We can always go "back" if we are deep in a song (restart) or if there is a prev track
    if (!playingAlbum && isPlayerReady) return true; // For upload mode (if any), technically allows restart
    if (playingAlbum) return true;
    return false;
  }, [playingAlbum, isPlayerReady]);

  const handleNext = () => {
    if (playingAlbum && hasNext) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      const nextTrack = playingAlbum.tracks[nextIndex];
      loadTrack(nextTrack, playingAlbum);
      // Use replaceState for sequential playback to avoid polluting history
      updateUrl(playingAlbum.id, nextTrack.id, true);
    }
  };

  const handlePrevious = () => {
    // If we are more than 3 seconds in, restart the song
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }

    // Otherwise go to previous track
    if (playingAlbum && currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      const prevTrack = playingAlbum.tracks[prevIndex];
      loadTrack(prevTrack, playingAlbum);
      // Use replaceState for sequential playback
      updateUrl(playingAlbum.id, prevTrack.id, true);
    }
  };

  const startPlayer = () => {
    if (files.audioUrl) {
      setIsPlayerReady(true);
      setIsPlayerExpanded(true);
    }
  };

  const closePlayer = () => {
    // Just hide the player view, don't stop music
    if (playingAlbum) {
      navigateToAlbum(playingAlbum);
    } else {
      navigateToLibrary();
    }
  };

  // Audio Event Handlers
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleVolume = (vol: number) => {
    setVolume(vol);
    if(audioRef.current) {
        audioRef.current.volume = vol;
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    if (hasNext) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  // Safe Image Handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = DEFAULT_COVER;
    e.currentTarget.onerror = null; // Prevent infinite loop
  };

  // Background style
  const backgroundStyle = useMemo(() => {
    const img = files.coverUrl || DEFAULT_COVER;
    return {
      backgroundImage: `url(${img})`,
    };
  }, [files.coverUrl]);

  return (
    <>
      {/* Audio Element - Always Rendered to persist state */}
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

      {/* --- LIBRARY VIEW --- */}
      {/* This section is hidden when Player is expanded, but stays mounted */}
      
      {!isPlayerExpanded && (
        <div 
          ref={scrollContainerRef}
          className="relative h-[100dvh] w-full flex flex-col items-center p-4 md:p-12 lg:p-16 bg-gray-950 overflow-y-auto custom-scrollbar pb-40"
        >
          {/* Animated Background Blobs */}
          <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="z-10 w-full max-w-6xl animate-in fade-in zoom-in duration-700 my-4 md:my-8 flex flex-col items-center">
              <div className="mb-10 text-center">
                  <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 mb-4">
                      Lyrical Player
                  </h1>
                  <p className="text-lg md:text-xl text-gray-400 font-light tracking-wide">
                      Play your collection of tracks synced with lrc files in a neat, web based format.
                  </p>
              </div>
            
              <div className="w-full">
                {/* --- VIEW: LIBRARY (Albums) --- */}
                {!selectedAlbum && (
                  <div className="animate-in slide-in-from-bottom-5 fade-in duration-300 min-h-[400px]">
                    {SAFE_LIBRARY.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
                        {SAFE_LIBRARY.map((album) => (
                          <button
                            key={album.id}
                            onClick={() => navigateToAlbum(album)}
                            className="group flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-2"
                          >
                            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all border border-white/5">
                                {album.coverSrc ? (
                                  <img 
                                      src={album.coverSrc} 
                                      alt={album.title} 
                                      onError={handleImageError}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                                    />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                                      <Disc size={40} />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                  <div className="bg-white text-black p-3 rounded-full transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                      <ListMusic size={24} />
                                  </div>
                                </div>
                            </div>
                            <div className="w-full text-left px-1">
                              <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate text-lg leading-tight">{album.title}</h4>
                              <p className="text-sm text-gray-400 truncate mt-1">{album.artist}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-3xl bg-white/5">
                          <Disc size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium">Your library is empty</p>
                          <p className="text-sm opacity-60 mt-2">Add albums to playlist.ts to see them here</p>
                        </div>
                    )}
                  </div>
                )}

                {/* --- VIEW: SELECTED ALBUM TRACKS --- */}
                {selectedAlbum && (
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 animate-in slide-in-from-right-10 fade-in duration-500 shadow-2xl backdrop-blur-sm">
                    <button 
                        onClick={() => navigateToLibrary()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-bold tracking-widest uppercase group"
                    >
                        <div className="bg-white/10 p-1.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                          <ArrowLeft size={16} />
                        </div>
                        Back to Library
                    </button>

                    <div className="flex flex-col md:flex-row gap-10">
                        {/* Left: Album Info */}
                        <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6">
                          <div className="w-48 mx-auto md:w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-800 border border-white/10 relative group">
                              <img 
                                src={selectedAlbum.coverSrc} 
                                alt={selectedAlbum.title} 
                                onError={handleImageError}
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                          </div>
                          <div className="text-center md:text-left">
                              <h2 className="text-3xl font-black text-white leading-tight mb-2">{selectedAlbum.title}</h2>
                              <p className="text-cyan-400 font-bold text-lg">{selectedAlbum.artist}</p>
                              <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500 font-mono uppercase tracking-widest">
                                  <Disc size={12} />
                                  <span>{selectedAlbum.tracks.length} Tracks</span>
                              </div>
                          </div>
                        </div>

                        {/* Right: Track List */}
                        <div className="flex-1 flex flex-col gap-2 md:max-h-[60vh] md:overflow-y-auto overflow-visible pr-0 md:pr-2 custom-scrollbar">
                          {selectedAlbum.tracks.map((track, idx) => {
                              const isCurrentTrack = playingAlbumIdRef.current === selectedAlbum.id && playingTrackIdRef.current === track.id;
                              return (
                                <button
                                  key={track.id}
                                  onClick={() => playTrackFromLibrary(track, selectedAlbum)}
                                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group text-left border border-transparent 
                                    ${isCurrentTrack ? 'bg-white/10 border-cyan-500/30' : 'hover:bg-white/10 hover:border-white/5'}
                                  `}
                                >
                                  <span className={`font-mono text-lg w-8 text-center transition-colors font-bold ${isCurrentTrack ? 'text-cyan-400' : 'text-gray-600 group-hover:text-cyan-400'}`}>
                                      {isCurrentTrack && isPlaying ? <div className="animate-pulse">▶</div> : String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="flex-1">
                                      <h4 className={`text-lg font-medium transition-colors ${isCurrentTrack ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'}`}>{track.title}</h4>
                                  </div>
                                  <div className={`p-3 rounded-full bg-cyan-500 text-black transition-all shadow-lg shadow-cyan-500/20 ${isCurrentTrack ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
                                      <Play size={20} className="fill-current ml-0.5" />
                                  </div>
                                </button>
                              );
                          })}
                        </div>
                    </div>
                  </div>
                )}
                
                {/* Floating Mini Player indicator if song is playing but player is closed */}
                {!isPlayerExpanded && isPlayerReady && files.audioFileName && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in">
                      <button 
                        onClick={() => setIsPlayerExpanded(true)}
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
                )}
              </div>
          </div>
        </div>
      )}

      {/* --- FULL SCREEN PLAYER VIEW --- */}
      {isPlayerExpanded && (
        <div className="fixed inset-0 z-40 bg-gray-900 text-white flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
          {/* Global Background Layer */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-[2s] scale-110 blur-[60px] md:blur-[80px] opacity-40 md:opacity-50 z-0 pointer-events-none"
            style={backgroundStyle}
          />
          <div className="absolute inset-0 bg-black/50 md:bg-black/40 z-0 pointer-events-none" />

          {/* --- MOBILE HEADER (Visible only on mobile/tablet) --- */}
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
            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* --- DESKTOP LEFT SIDE (Cover & Controls) --- */}
          {/* Hidden on mobile, Flex on Medium+ screens */}
          <div className="hidden md:flex w-1/2 lg:w-[45%] h-full flex-col justify-center items-center p-8 lg:p-12 relative z-10">
              <div className="w-full max-w-md flex flex-col gap-6 lg:gap-10 h-full justify-center">
                  <button 
                    onClick={closePlayer}
                    className="self-start flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/10 border border-transparent hover:border-white/10"
                  >
                      <ArrowLeft size={16} /> Library
                  </button>

                  {/* Desktop Cover Art */}
                  <div className="relative aspect-square w-full shrink-0 max-h-[50vh] rounded-3xl shadow-2xl overflow-hidden border border-white/10 group mx-auto">
                      <img 
                          src={files.coverUrl || DEFAULT_COVER} 
                          alt="Album Cover" 
                          onError={handleImageError}
                          className={`w-full h-full object-cover transition-transform duration-[20s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`}
                      />
                      {/* Glass reflection effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                  </div>

                  {/* Desktop Track Info & Controls */}
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

          {/* --- LYRICS AREA (Shared) --- */}
          {/* Full width on mobile, right side on desktop */}
          <div className="flex-1 h-full relative z-10 flex flex-col">
              <div className="flex-1 relative overflow-hidden">
                {/* Gradient overlay for text readability on mobile */}
                <div className="md:hidden absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none z-0" />
                
                <LyricsContainer 
                    lyrics={lyrics}
                    currentTime={currentTime}
                    isLoaded={!!files.lrcContent}
                    onLineClick={handleSeek}
                />
              </div>

              {/* --- MOBILE PLAYER BAR (Visible only on mobile) --- */}
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
      )}
    </>
  );
}
