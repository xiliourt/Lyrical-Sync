export interface LyricLine {
  time: number; // Time in seconds
  text: string;
  id: string; // Unique ID for React keys
}

export interface MediaFiles {
  audioUrl: string | null;
  lrcContent: string | null;
  coverUrl: string | null;
  audioFileName: string | null; // Acts as the Track Title
  artist: string | null; // Artist Name
}

export interface Track {
  id: string;
  title: string;
  audioSrc: string;
  lrcSrc: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverSrc: string;
  tracks: Track[];
}