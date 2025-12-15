// Storage helper functions for playlists and favorites
const Storage = {
    // Get all playlists for current user
    getUserPlaylists: function() {
        const user = Auth.getCurrentUser();
        if (!user) return [];
        
        const playlists = JSON.parse(localStorage.getItem('playlists') || '{}');
        return playlists[user.id] || [];
    },

    // Save playlists for current user
    saveUserPlaylists: function(userPlaylists) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const playlists = JSON.parse(localStorage.getItem('playlists') || '{}');
        playlists[user.id] = userPlaylists;
        localStorage.setItem('playlists', JSON.stringify(playlists));
    },

    // Create new playlist
    createPlaylist: function(name) {
        const userPlaylists = this.getUserPlaylists();
        const newPlaylist = {
            id: 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            songs: [],
            createdAt: new Date().toISOString()
        };
        userPlaylists.push(newPlaylist);
        this.saveUserPlaylists(userPlaylists);
        return newPlaylist;
    },

    // Get playlist by ID
    getPlaylist: function(playlistId) {
        const userPlaylists = this.getUserPlaylists();
        return userPlaylists.find(p => p.id === playlistId);
    },

    // Delete playlist
    deletePlaylist: function(playlistId) {
        let userPlaylists = this.getUserPlaylists();
        userPlaylists = userPlaylists.filter(p => p.id !== playlistId);
        this.saveUserPlaylists(userPlaylists);
    },

    // Add song to playlist
    addSongToPlaylist: function(playlistId, song) {
        const userPlaylists = this.getUserPlaylists();
        const playlist = userPlaylists.find(p => p.id === playlistId);
        
        if (playlist) {
            // Check if song already exists in playlist
            if (!playlist.songs.some(s => s.videoId === song.videoId)) {
                playlist.songs.push({
                    ...song,
                    addedAt: new Date().toISOString(),
                    rating: 0
                });
                this.saveUserPlaylists(userPlaylists);
                return true;
            }
        }
        return false;
    },

    // Remove song from playlist
    removeSongFromPlaylist: function(playlistId, videoId) {
        const userPlaylists = this.getUserPlaylists();
        const playlist = userPlaylists.find(p => p.id === playlistId);
        
        if (playlist) {
            playlist.songs = playlist.songs.filter(s => s.videoId !== videoId);
            this.saveUserPlaylists(userPlaylists);
            return true;
        }
        return false;
    },

    // Update song rating
    updateSongRating: function(playlistId, videoId, rating) {
        const userPlaylists = this.getUserPlaylists();
        const playlist = userPlaylists.find(p => p.id === playlistId);
        
        if (playlist) {
            const song = playlist.songs.find(s => s.videoId === videoId);
            if (song) {
                song.rating = rating;
                this.saveUserPlaylists(userPlaylists);
                return true;
            }
        }
        return false;
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
