"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Plus, X, Repeat, Search, Music, FolderPlus, Trash2, Edit2, Check } from 'lucide-react';

export default function MusicPlayer() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Guardar datos cuando cambien las playlists
  useEffect(() => {
    if (playlists.length > 0) {
      saveData();
    }
  }, [playlists]);

  const loadData = async () => {
    try {
      const w = window as any;
      let raw: string | null = null;
      if (w.storage && typeof w.storage.get === 'function') {
        const result = await w.storage.get('music-player-data');
        raw = result?.value ?? null;
      } else if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem('music-player-data');
      }
      if (raw) {
        const data = JSON.parse(raw);
        setPlaylists(data.playlists || []);
        setCurrentPlaylistId(data.currentPlaylistId ?? null);
      } else {
        // Crear playlist por defecto si no hay datos
        const defaultPlaylist = {
          id: Date.now(),
          name: 'Mi Música',
          songs: []
        };
        setPlaylists([defaultPlaylist]);
        setCurrentPlaylistId(defaultPlaylist.id);
      }
    } catch (error) {
      // Si no existe, crear playlist por defecto
      const defaultPlaylist = {
        id: Date.now(),
        name: 'Mi Música',
        songs: []
      };
      setPlaylists([defaultPlaylist]);
      setCurrentPlaylistId(defaultPlaylist.id);
    }
  };

  const saveData = async () => {
    try {
      const dataToSave = {
        playlists: playlists,
        currentPlaylistId
      };
      const w = window as any;
      const payload = JSON.stringify(dataToSave);
      if (w.storage && typeof w.storage.set === 'function') {
        await w.storage.set('music-player-data', payload);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('music-player-data', payload);
      } else {
        console.warn('No hay almacenamiento disponible para persistir datos');
      }
    } catch (error) {
      console.error('Error guardando datos:', error);
    }
  };

  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
  const songs = currentPlaylist?.songs || [];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
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
    const newSongs = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === currentPlaylistId
        ? { ...playlist, songs: [...playlist.songs, ...newSongs] }
        : playlist
    ));
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = {
      id: Date.now(),
      name: newPlaylistName.trim(),
      songs: []
    };
    
    setPlaylists(prev => [...prev, newPlaylist]);
    setCurrentPlaylistId(newPlaylist.id);
    setNewPlaylistName('');
    setShowNewPlaylistModal(false);
    setCurrentSongIndex(0);
    setIsPlaying(false);
  };

  const deletePlaylist = (id: number) => {
    if (playlists.length === 1) return;
    
    const newPlaylists = playlists.filter(p => p.id !== id);
    setPlaylists(newPlaylists);
    
    if (currentPlaylistId === id) {
      setCurrentPlaylistId(newPlaylists[0].id);
      setCurrentSongIndex(0);
      setIsPlaying(false);
    }
  };

  const renamePlaylist = (id: number) => {
    if (!editingName.trim()) return;
    
    setPlaylists(prev => prev.map(p => 
      p.id === id ? { ...p, name: editingName.trim() } : p
    ));
    setEditingPlaylistId(null);
    setEditingName('');
  };

  const togglePlay = () => {
    if (!songs.length) return;
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
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
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === currentPlaylistId
        ? { ...playlist, songs: playlist.songs.filter((song: any) => song.id !== id) }
        : playlist
    ));
    
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
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredSongs = songs.filter((song: any) =>
    song.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (songs.length > 0 && isPlaying) {
      audioRef.current?.play();
    }
  }, [currentSongIndex]);

  const currentSong = songs[currentSongIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar de Playlists */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Mis Listas</h2>
              <button
                onClick={() => setShowNewPlaylistModal(true)}
                className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-all"
              >
                <FolderPlus className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
              {playlists.map(playlist => (
                <div
                  key={playlist.id}
                  className={`rounded-xl transition-all ${
                    playlist.id === currentPlaylistId
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      setCurrentPlaylistId(playlist.id);
                      setCurrentSongIndex(0);
                      setIsPlaying(false);
                    }}
                  >
                    {editingPlaylistId === playlist.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && renamePlaylist(playlist.id)}
                          className="flex-1 bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => renamePlaylist(playlist.id)}
                          className="p-1 bg-green-500 rounded-lg hover:bg-green-600"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{playlist.name}</h3>
                          <p className="text-white/60 text-sm">{playlist.songs.length} canciones</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPlaylistId(playlist.id);
                              setEditingName(playlist.name);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4 text-white/70" />
                          </button>
                          {playlists.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlaylist(playlist.id);
                              }}
                              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Canciones dentro de cada playlist */}
                  {playlist.songs.length > 0 && (
                    <div className="px-4 pb-4 space-y-1">
                      {playlist.songs.slice(0, 3).map((song: any) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-white/70 text-sm"
                        >
                          <Music className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{song.name}</span>
                        </div>
                      ))}
                      {playlist.songs.length > 3 && (
                        <p className="text-white/50 text-xs pl-2">
                          +{playlist.songs.length - 3} más
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Player y Lista de Reproducción */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Principal */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Music className="w-8 h-8" />
                    {currentPlaylist?.name || 'Mi Reproductor'}
                  </h1>
                  <p className="text-white/60 text-sm mt-1">{songs.length} canciones en total</p>
                </div>
              </div>

              {/* Album Art */}
              <div className="relative mb-6 group">
                <div className="w-full aspect-video max-w-2xl mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                  {currentSong ? (
                    <div className="text-center p-8">
                      <Music className="w-24 h-24 text-white/80 mx-auto mb-4 animate-pulse" />
                      <h2 className="text-2xl font-bold text-white">{currentSong.name}</h2>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Music className="w-24 h-24 text-white/50 mx-auto mb-4" />
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
              <div className="flex items-center justify-center gap-4">
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

            {/* Lista de Canciones */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              {/* Search */}
              <div className="relative mb-4">
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
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {filteredSongs.length > 0 ? (
                  filteredSongs.map((song: any, index: number) => {
                    const actualIndex = songs.findIndex((s: any) => s.id === song.id);
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
        </div>

        <audio ref={audioRef} src={currentSong?.url} />
      </div>

      {/* Modal Nueva Playlist */}
      {showNewPlaylistModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Nueva Lista de Reproducción</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
              placeholder="Nombre de la lista..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewPlaylistModal(false);
                  setNewPlaylistName('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

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