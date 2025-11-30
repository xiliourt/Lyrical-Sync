import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../types';

interface LyricsContainerProps {
  lyrics: LyricLine[];
  currentTime: number;
  isLoaded: boolean;
  onLineClick: (time: number) => void;
}

export const LyricsContainer: React.FC<LyricsContainerProps> = ({ lyrics, currentTime, isLoaded, onLineClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  // Find the current active line index
  const activeIndex = lyrics.reduce((acc, line, index) => {
    if (line.time <= currentTime) return index;
    return acc;
  }, -1);

  // Auto-scroll logic
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLoaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4 animate-pulse">
        <div className="w-12 h-1 bg-white/10 rounded-full mb-2" />
        <p className="text-sm font-medium tracking-widest uppercase font-lyrics">Waiting for Lyrics</p>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return (
       <div className="h-full flex items-center justify-center text-white/40">
        <p className="font-lyrics text-xl">No synced lyrics available</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto no-scrollbar px-6 md:px-16 pt-24 pb-12 md:py-10 relative z-10"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)'
      }}
    >
      <div className="space-y-10 md:space-y-12 min-h-[50vh] py-[45vh]">
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          
          // Calculate progress for the active line to fade it out at the end
          let dynamicStyle = {};
          if (isActive) {
             const nextLine = lyrics[index + 1];
             // If last line, assume arbitrary duration or keep active
             if (nextLine) {
                const duration = nextLine.time - line.time;
                const elapsed = currentTime - line.time;
                const progress = Math.max(0, Math.min(1, elapsed / duration));
                
                // Start fading out in the last 15% of the line
                if (progress > 0.85) {
                   const fadeFactor = (progress - 0.85) / 0.15; // 0 to 1
                   dynamicStyle = {
                      opacity: 1 - (fadeFactor * 0.4), // Fade down to 0.6
                      transform: `scale(${1.1 - (fadeFactor * 0.05)})`, // Shrink slightly
                      filter: `blur(${fadeFactor * 2}px)` // Blur slightly
                   };
                }
             }
          }

          let baseClass = "";
          
          if (isActive) {
            // Active: Massive, Bright, Crisp (Dynamic styles applied above take precedence for fade out)
            baseClass = "scale-100 md:scale-110 text-white opacity-100 blur-0 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] font-bold text-cyan-50";
          } else if (isPast) {
            // Past: Darker, receding
            baseClass = "scale-95 text-gray-600 opacity-30 blur-[1px] font-medium hover:opacity-60 hover:blur-0 hover:text-gray-300";
          } else {
            // Future: Lighter gray, anticipation
            baseClass = "scale-95 text-gray-400 opacity-50 blur-[0.5px] font-medium hover:opacity-80 hover:blur-0 hover:text-gray-100";
          }

          return (
            <p
              key={line.id}
              ref={isActive ? activeLineRef : null}
              className={`
                text-center transition-all duration-1000 cubic-bezier(0.25, 0.46, 0.45, 0.94) cursor-pointer origin-center
                text-3xl md:text-4xl lg:text-5xl leading-snug tracking-wide font-lyrics select-none
                ${baseClass}
              `}
              style={{
                willChange: 'transform, opacity, filter',
                fontVariantNumeric: 'tabular-nums',
                ...dynamicStyle
              }}
              onClick={() => {
                 onLineClick(line.time);
              }}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>
  );
};
