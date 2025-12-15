// Storage helper functions for playlists - now using server API
const Storage = {
    // Cache for playlists
    _playlistsCache: null,
    _cacheUserId: null,

    // Clear cache
    clearCache: function() {
        this._playlistsCache = null;
        this._cacheUserId = null;
    },

    // Get all playlists for current user (from server)
    getUserPlaylists: function() {
        // Return cached data if available
        const user = Auth.getCurrentUser();
        if (!user) return [];
        
        if (this._playlistsCache && this._cacheUserId === user.id) {
            return this._playlistsCache;
        }
        
        // Return empty array - use async method for actual data
        return [];
    },

    // Async version to get playlists from server
    fetchUserPlaylists: async function() {
        const user = Auth.getCurrentUser();
        if (!user) return [];
        
        const result = await API.getPlaylists(user.id);
        if (result.success) {
            this._playlistsCache = result.playlists;
            this._cacheUserId = user.id;
            return result.playlists;
        }
        return [];
    },

    // Save playlists for current user (deprecated - use API methods)
    saveUserPlaylists: function(userPlaylists) {
        // This is now handled by the server
        this._playlistsCache = userPlaylists;
    },

    // Create new playlist
    createPlaylist: async function(name) {
        const user = Auth.getCurrentUser();
        if (!user) return null;

        const result = await API.createPlaylist(user.id, name);
        if (result.success) {
            // Update cache
            if (this._playlistsCache) {
                this._playlistsCache.push(result.playlist);
            }
            return result.playlist;
        }
        return null;
    },

    // Get playlist by ID
    getPlaylist: function(playlistId) {
        const userPlaylists = this.getUserPlaylists();
        return userPlaylists.find(p => p.id === playlistId);
    },

    // Get playlist by ID (async)
    fetchPlaylist: async function(playlistId) {
        const playlists = await this.fetchUserPlaylists();
        return playlists.find(p => p.id === playlistId);
    },

    // Delete playlist
    deletePlaylist: async function(playlistId) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        const result = await API.deletePlaylist(user.id, playlistId);
        if (result.success) {
            // Update cache
            if (this._playlistsCache) {
                this._playlistsCache = this._playlistsCache.filter(p => p.id !== playlistId);
            }
            return true;
        }
        return false;
    },

    // Add song to playlist
    addSongToPlaylist: async function(playlistId, song) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        const result = await API.addSongToPlaylist(user.id, playlistId, song);
        if (result.success) {
            // Update cache
            if (this._playlistsCache) {
                const playlist = this._playlistsCache.find(p => p.id === playlistId);
                if (playlist) {
                    playlist.songs.push(result.song);
                }
            }
            return true;
        }
        return false;
    },

    // Remove song from playlist
    removeSongFromPlaylist: async function(playlistId, songId) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        const result = await API.removeSongFromPlaylist(user.id, playlistId, songId);
        if (result.success) {
            // Update cache
            if (this._playlistsCache) {
                const playlist = this._playlistsCache.find(p => p.id === playlistId);
                if (playlist) {
                    playlist.songs = playlist.songs.filter(s => 
                        s.videoId !== songId && s.localId !== songId
                    );
                }
            }
            return true;
        }
        return false;
    },

    // Update song rating
    updateSongRating: async function(playlistId, songId, rating) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        const result = await API.updateSongRating(user.id, playlistId, songId, rating);
        if (result.success) {
            // Update cache
            if (this._playlistsCache) {
                const playlist = this._playlistsCache.find(p => p.id === playlistId);
                if (playlist) {
                    const song = playlist.songs.find(s => 
                        s.videoId === songId || s.localId === songId
                    );
                    if (song) {
                        song.rating = rating;
                    }
                }
            }
            return true;
        }
        return false;
    },

    // Upload MP3 file to playlist
    uploadMP3: async function(playlistId, file) {
        const user = Auth.getCurrentUser();
        if (!user) return null;

        const result = await API.uploadMP3(user.id, playlistId, file);
        if (result.success) {
            // Update cache
            if (this._playlistsCache) {
                const playlist = this._playlistsCache.find(p => p.id === playlistId);
                if (playlist) {
                    playlist.songs.push(result.song);
                }
            }
            return result.song;
        }
        return null;
    },

    // Check if video is in any playlist
    isVideoInFavorites: function(videoId) {
        const userPlaylists = this.getUserPlaylists();
        for (const playlist of userPlaylists) {
            if (playlist.songs.some(s => s.videoId === videoId)) {
                return true;
            }
        }
        return false;
    },

    // Get playlists containing a video
    getPlaylistsContainingVideo: function(videoId) {
        const userPlaylists = this.getUserPlaylists();
        return userPlaylists.filter(playlist => 
            playlist.songs.some(s => s.videoId === videoId)
        );
    }
};
