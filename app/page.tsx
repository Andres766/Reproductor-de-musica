"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Plus, X, Repeat, Search, List, Music } from 'lucide-react';

// Tipos
type RepeatMode = 'none' | 'all' | 'one';
interface Song {
  id: number;
  name: string;
  url: string;
  file: File;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPlaylist, setShowPlaylist] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all') {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, currentSongIndex, songs.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newSongs: Song[] = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file),
      file: file
    }));
    setSongs(prev => [...prev, ...newSongs]);
  };

  const togglePlay = () => {
    if (!songs.length || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!songs.length) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!songs.length) return;
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const removeSong = (id: number) => {
    const newSongs = songs.filter(song => song.id !== id);
    setSongs(newSongs);
    if (songs[currentSongIndex]?.id === id) {
      setCurrentSongIndex(0);
      setIsPlaying(false);
    }
  };

  const playSong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredSongs = songs.filter(song =>
    song.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (songs.length > 0 && isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSongIndex, songs.length, isPlaying]);

  const currentSong = songs[currentSongIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player Principal */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Music className="w-8 h-8" />
                Mi Reproductor
              </h1>
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="lg:hidden p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
              >
                <List className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Album Art */}
            <div className="relative mb-8 group">
              <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                {currentSong ? (
                  <div className="text-center p-8">
                    <Music className="w-32 h-32 text-white/80 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-white">{currentSong.name}</h2>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Music className="w-32 h-32 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">No hay canciones</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div
                onClick={handleSeek}
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden group"
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all group-hover:h-3"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-white/70 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={toggleRepeat}
                className={`p-3 rounded-full transition-all relative ${
                  repeatMode !== 'none'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Repeat className="w-5 h-5" />
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                )}
              </button>

              <button
                onClick={handlePrevious}
                disabled={!songs.length}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <SkipBack className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={togglePlay}
                disabled={!songs.length}
                className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:scale-110 transition-all shadow-lg disabled:opacity-50"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={!songs.length}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <SkipForward className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Playlist */}
          <div className={`bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 ${!showPlaylist && 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Lista de Reproducción</h2>
              <span className="text-white/70">{songs.length} canciones</span>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Buscar canciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all"
              />
            </div>

            {/* Songs List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song, index) => {
                  const actualIndex = songs.findIndex(s => s.id === song.id);
                  const isCurrentSong = actualIndex === currentSongIndex;
                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                        isCurrentSong
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => playSong(actualIndex)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ${isCurrentSong && isPlaying ? 'animate-pulse' : ''}`}>
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-medium truncate">{song.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSong(song.id);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">
                    {searchQuery ? 'No se encontraron canciones' : 'Agrega canciones para empezar'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <audio ref={audioRef} src={currentSong?.url} />
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}