import React, { useRef } from 'react';
import { Upload, Music, FileText, Image as ImageIcon, X } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: { audio?: File; lrc?: File; cover?: File }) => void;
  currentFiles: {
    audioName?: string | null;
    lrcName?: string | null;
    coverName?: string | null;
  };
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, currentFiles }) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (type: 'audio' | 'lrc' | 'cover') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFilesSelected({ [type]: file });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Upload Your Tracks
        </h2>
        <p className="text-gray-400">Supported: MP3/WAV Audio, .LRC Lyrics, JPG/PNG Cover</p>
      </div>

      <div className="grid gap-6">
        {/* Audio Upload */}
        <div 
          onClick={() => audioInputRef.current?.click()}
          className={`group cursor-pointer p-4 rounded-xl border-2 border-dashed transition-all duration-300 ${
            currentFiles.audioName 
              ? 'border-green-500/50 bg-green-500/10' 
              : 'border-gray-600 hover:border-blue-400 hover:bg-blue-500/5'
          }`}
        >
          <input type="file" ref={audioInputRef} accept="audio/*" onChange={handleFileChange('audio')} hidden />
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentFiles.audioName ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <Music size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">Audio File</h3>
              <p className="text-sm text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                {currentFiles.audioName || "Click to browse or drop .mp3/.wav"}
              </p>
            </div>
            {currentFiles.audioName ? <div className="text-green-400 font-bold text-sm">READY</div> : <Upload className="text-gray-500 group-hover:text-blue-400" size={20} />}
          </div>
        </div>

        {/* LRC Upload */}
        <div 
          onClick={() => lrcInputRef.current?.click()}
          className={`group cursor-pointer p-4 rounded-xl border-2 border-dashed transition-all duration-300 ${
            currentFiles.lrcName 
              ? 'border-green-500/50 bg-green-500/10' 
              : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/5'
          }`}
        >
          <input type="file" ref={lrcInputRef} accept=".lrc,.txt" onChange={handleFileChange('lrc')} hidden />
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentFiles.lrcName ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">Lyrics File</h3>
              <p className="text-sm text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                {currentFiles.lrcName || "Click to browse or drop .lrc"}
              </p>
            </div>
            {currentFiles.lrcName ? <div className="text-green-400 font-bold text-sm">READY</div> : <Upload className="text-gray-500 group-hover:text-purple-400" size={20} />}
          </div>
        </div>

        {/* Cover Upload */}
        <div 
          onClick={() => coverInputRef.current?.click()}
          className={`group cursor-pointer p-4 rounded-xl border-2 border-dashed transition-all duration-300 ${
            currentFiles.coverName 
              ? 'border-green-500/50 bg-green-500/10' 
              : 'border-gray-600 hover:border-pink-400 hover:bg-pink-500/5'
          }`}
        >
          <input type="file" ref={coverInputRef} accept="image/*" onChange={handleFileChange('cover')} hidden />
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentFiles.coverName ? 'bg-green-500/20 text-green-400' : 'bg-pink-500/20 text-pink-400'}`}>
              <ImageIcon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">Cover Art</h3>
              <p className="text-sm text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                {currentFiles.coverName || "Click to browse or drop .jpg/.png"}
              </p>
            </div>
             {currentFiles.coverName ? <div className="text-green-400 font-bold text-sm">READY</div> : <Upload className="text-gray-500 group-hover:text-pink-400" size={20} />}
          </div>
        </div>
      </div>
    </div>
  );
};