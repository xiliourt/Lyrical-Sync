
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { parseLrc } from '../utils/lrcParser';
import { MediaFiles, LyricLine, Album, Track } from '../types';
import { LIBRARY } from '../playlist';

const DEFAULT_COVER = "/favicon.png";
const SAFE_LIBRARY = Array.isArray(LIBRARY) ? LIBRARY : [];

export const useLyrical = () => {
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
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [playingAlbum, setPlayingAlbum] = useState<Album | null>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);

    const audioRef = useRef<HTMLAudioElement>(null);
    const playingTrackIdRef = useRef<string | null>(null);
    const playingAlbumIdRef = useRef<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const updateUrl = useCallback((albumId?: string, trackId?: string, replace = false) => {
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
    }, []);

    const loadTrack = useCallback(async (track: Track, album: Album) => {
        try {
            playingTrackIdRef.current = track.id;
            playingAlbumIdRef.current = album.id;

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

    useEffect(() => {
        const syncWithUrl = () => {
            const path = window.location.pathname;
            const segments = path.split('/').filter(p => p && p !== '');
            const albumId = segments[0];
            const trackId = segments[1];

            if (albumId) {
                const foundAlbum = SAFE_LIBRARY.find(a => a.id === albumId);
                if (foundAlbum) {
                    setSelectedAlbum(foundAlbum);
                    if (trackId) {
                        setIsPlayerExpanded(true);
                        if (playingTrackIdRef.current === trackId && playingAlbumIdRef.current === albumId) {
                            return;
                        }
                        const trackIndex = foundAlbum.tracks.findIndex(t => t.id === trackId);
                        if (trackIndex !== -1) {
                            setPlayingAlbum(foundAlbum);
                            setCurrentTrackIndex(trackIndex);
                            loadTrack(foundAlbum.tracks[trackIndex], foundAlbum);
                        }
                    } else {
                        setIsPlayerExpanded(false);
                    }
                } else {
                    setSelectedAlbum(null);
                    setIsPlayerExpanded(false);
                }
            } else {
                setSelectedAlbum(null);
                setIsPlayerExpanded(false);
            }
        };

        syncWithUrl();
        window.addEventListener('popstate', syncWithUrl);
        return () => window.removeEventListener('popstate', syncWithUrl);
    }, [loadTrack]);

    useEffect(() => {
        if (playingAlbum && currentTrackIndex !== -1) {
            const track = playingAlbum.tracks[currentTrackIndex];
            document.title = track.title;
        } else if (selectedAlbum) {
            document.title = selectedAlbum.title;
        } else {
            document.title = import.meta.env.VITE_SITE_NAME || "Lyrical Player";
        }
    }, [playingAlbum, currentTrackIndex, selectedAlbum]);

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

    const playTrackFromLibrary = (track: Track, album: Album) => {
        setIsPlayerExpanded(true);
        if (playingTrackIdRef.current === track.id && playingAlbumIdRef.current === album.id) {
            updateUrl(album.id, track.id);
            return;
        }
        setPlayingAlbum(album);
        const index = album.tracks.findIndex(t => t.id === track.id);
        setCurrentTrackIndex(index);
        loadTrack(track, album);
        updateUrl(album.id, track.id, true);
    };

    const hasNext = useMemo(() => {
        if (!playingAlbum) return false;
        return currentTrackIndex < playingAlbum.tracks.length - 1;
    }, [playingAlbum, currentTrackIndex]);

    const handleNext = () => {
        if (playingAlbum && hasNext) {
            const nextIndex = currentTrackIndex + 1;
            setCurrentTrackIndex(nextIndex);
            const nextTrack = playingAlbum.tracks[nextIndex];
            loadTrack(nextTrack, playingAlbum);
            updateUrl(playingAlbum.id, nextTrack.id, true);
        }
    };

    const hasPrevious = useMemo(() => {
        if (!playingAlbum && isPlayerReady) return true;
        if (playingAlbum) return true;
        return false;
    }, [playingAlbum, isPlayerReady]);

    const handlePrevious = () => {
        if (currentTime > 3) {
            handleSeek(0);
            return;
        }
        if (playingAlbum && currentTrackIndex > 0) {
            const prevIndex = currentTrackIndex - 1;
            setCurrentTrackIndex(prevIndex);
            const prevTrack = playingAlbum.tracks[prevIndex];
            loadTrack(prevTrack, playingAlbum);
            updateUrl(playingAlbum.id, prevTrack.id, true);
        }
    };

    const closePlayer = () => {
        if (playingAlbum) {
            navigateToAlbum(playingAlbum);
        } else {
            navigateToLibrary();
        }
    };

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
        if (audioRef.current) {
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

    const backgroundStyle = useMemo(() => {
        const img = files.coverUrl || DEFAULT_COVER;
        return {
            backgroundImage: `url(${img})`,
        };
    }, [files.coverUrl]);

    return {
        files,
        lyrics,
        isPlaying,
        currentTime,
        duration,
        volume,
        isPlayerReady,
        isPlayerExpanded,
        selectedAlbum,
        playingAlbum,
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
    };
};
