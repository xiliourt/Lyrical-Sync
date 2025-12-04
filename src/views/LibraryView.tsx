
import React from 'react';
import { Disc, ListMusic } from 'lucide-react';
import { Album } from '../types';
import { AlbumArt } from '../components/AlbumArt';

interface LibraryViewProps {
    albums: Album[];
    navigateToAlbum: (album: Album) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ albums, navigateToAlbum }) => {
    return (
        <div className="animate-in slide-in-from-bottom-5 fade-in duration-300 min-h-[400px]">
            {albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
                    {albums.map((album) => (
                        <button
                            key={album.id}
                            onClick={() => navigateToAlbum(album)}
                            className="group flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-2"
                        >
                            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all border border-white/5">
                                <AlbumArt album={album} />
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
    );
};
