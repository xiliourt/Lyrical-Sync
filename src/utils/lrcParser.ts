import { LyricLine } from '../types';

export const parseLrc = (lrc: string): LyricLine[] => {
  // Split by newline, handling LF, CRLF, and CR (old Mac) explicitly
  // This prevents issues where the whole file is treated as one line
  const lines = lrc.split(/\r\n|\r|\n/);
  
  // Regex to capture the timestamp parts. 
  // Supports [mm:ss], [mm:ss.xx], [mm:ss:xx]
  const timeTagRegex = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  
  const result: LyricLine[] = [];
  let idCounter = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Find all timestamps in the line
    const matches = [...trimmedLine.matchAll(timeTagRegex)];
    
    if (matches.length > 0) {
      // Remove all timestamps to get the lyrics text
      const text = trimmedLine.replace(timeTagRegex, '').trim();
      
      // Create a lyric entry for each timestamp found
      matches.forEach(match => {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        // Handle milliseconds: 
        // 2 digits (e.g. .50) = 500ms
        // 3 digits (e.g. .500) = 500ms
        // 1 digit (e.g. .5) = 500ms (usually)
        const rawMs = match[3] || '0';
        const milliseconds = parseInt(rawMs.padEnd(3, '0'), 10);
        
        const time = minutes * 60 + seconds + milliseconds / 1000;

        result.push({
          id: `line-${idCounter++}`,
          time,
          text,
        });
      });
    }
  }

  // Sort by time to ensure correct playback order
  return result.sort((a, b) => a.time - b.time);
};

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};