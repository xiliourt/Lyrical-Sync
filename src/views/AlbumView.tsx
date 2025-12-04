
import React from 'react';
import { ArrowLeft, Disc, Play } from 'lucide-react';
import { Album, Track } from '../types';
import { AlbumArt } from '../components/AlbumArt';

interface AlbumViewProps {
    album: Album;
    navigateToLibrary: () => void;
    playTrackFromLibrary: (track: Track, album: Album) => void;
    playingAlbumId: string | null;
    playingTrackId: string | null;
    isPlaying: boolean;
}

export const AlbumView: React.FC<AlbumViewProps> = ({
    album,
    navigateToLibrary,
    playTrackFromLibrary,
    playingAlbumId,
    playingTrackId,
    isPlaying
}) => {
    return (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 animate-in slide-in-from-right-10 fade-in duration-500 shadow-2xl backdrop-blur-sm">
            <button
                onClick={navigateToLibrary}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-bold tracking-widest uppercase group"
            >
                <div className="bg-white/10 p-1.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                    <ArrowLeft size={16} />
                </div>
                Back to Library
            </button>

            <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6">
                    <div className="w-48 mx-auto md:w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gray-800 border border-white/10 relative group">
                        <AlbumArt album={album} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-white leading-tight mb-2">{album.title}</h2>
                        <p className="text-cyan-400 font-bold text-lg">{album.artist}</p>
                        <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500 font-mono uppercase tracking-widest">
                            <Disc size={12} />
                            <span>{album.tracks.length} Tracks</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 md:max-h-[60vh] md:overflow-y-auto overflow-visible pr-0 md:pr-2 custom-scrollbar">
                    {album.tracks.map((track, idx) => {
                        const isCurrentTrack = playingAlbumId === album.id && playingTrackId === track.id;
                        return (
                            <button
                                key={track.id}
                                onClick={() => playTrackFromLibrary(track, album)}
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
    );
};
