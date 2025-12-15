// API Service for server communication
const API = {
    BASE_URL: '',  // Empty for same-origin requests

    // ============================================
    // AUTH API
    // ============================================

    // Register new user
    register: async function(userData) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('Register API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Login user
    login: async function(username, password) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Logout user
    logout: async function() {
        try {
            await fetch(`${this.BASE_URL}/api/auth/logout`, {
                method: 'POST'
            });
            return { success: true };
        } catch (error) {
            console.error('Logout API error:', error);
            return { success: true }; // Still return success as logout is client-side
        }
    },

    // Check if username exists
    checkUsername: async function(username) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/auth/check-username/${encodeURIComponent(username)}`);
            return await response.json();
        } catch (error) {
            console.error('Check username API error:', error);
            return { exists: false };
        }
    },

    // ============================================
    // PLAYLISTS API
    // ============================================

    // Get all playlists for current user
    getPlaylists: async function(userId) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/playlists/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Get playlists API error:', error);
            return { success: false, playlists: [] };
        }
    },

    // Create new playlist
    createPlaylist: async function(userId, name) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/playlists/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });
            return await response.json();
        } catch (error) {
            console.error('Create playlist API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Delete playlist
    deletePlaylist: async function(userId, playlistId) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/playlists/${userId}/${playlistId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Delete playlist API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Add song to playlist
    addSongToPlaylist: async function(userId, playlistId, song) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/playlists/${userId}/${playlistId}/songs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(song)
            });
            return await response.json();
        } catch (error) {
            console.error('Add song API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Remove song from playlist
    removeSongFromPlaylist: async function(userId, playlistId, songId) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/playlists/${userId}/${playlistId}/songs/${songId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Remove song API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // Update song rating
    updateSongRating: async function(userId, playlistId, songId, rating) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/playlists/${userId}/${playlistId}/songs/${songId}/rating`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rating })
            });
            return await response.json();
        } catch (error) {
            console.error('Update rating API error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    // ============================================
    // UPLOAD API
    // ============================================

    // Upload MP3 file
    uploadMP3: async function(userId, playlistId, file) {
        try {
            const formData = new FormData();
            formData.append('mp3file', file);

            const response = await fetch(`${this.BASE_URL}/api/upload/${userId}/${playlistId}`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload API error:', error);
            return { success: false, message: 'Network error' };
        }
    }
};
