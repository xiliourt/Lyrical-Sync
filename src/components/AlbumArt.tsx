
import React from 'react';
import { Disc } from 'lucide-react';

const DEFAULT_COVER = "/favicon.png";

interface AlbumArtProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    album: {
        coverSrc?: string;
        title: string;
    };
    className?: string;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({ album, className, ...props }) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = DEFAULT_COVER;
        e.currentTarget.onerror = null;
    };

    return (
        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 shadow-2xl transition-all border border-white/5 ${className}`}>
            {album.coverSrc ? (
                <img
                    src={album.coverSrc}
                    alt={album.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    {...props}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                    <Disc size={40} />
                </div>
            )}
        </div>
    );
};
