const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// Data paths
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLAYLISTS_DIR = path.join(DATA_DIR, 'playlists');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories and files exist
function ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PLAYLISTS_DIR)) {
        fs.mkdirSync(PLAYLISTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
}

ensureDataFiles();

// Helper functions
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUserPlaylistsFile(userId) {
    return path.join(PLAYLISTS_DIR, `${userId}.json`);
}

function readUserPlaylists(userId) {
    const filePath = getUserPlaylistsFile(userId);
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        return [];
    }
}

function writeUserPlaylists(userId, playlists) {
    const filePath = getUserPlaylistsFile(userId);
    fs.writeFileSync(filePath, JSON.stringify(playlists, null, 2));
}

// Multer configuration for MP3 uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || 
        file.originalname.toLowerCase().endsWith('.mp3')) {
        cb(null, true);
    } else {
        cb(new Error('Only MP3 files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', (req, res) => {
    try {
        const { username, password, firstName, imageUrl } = req.body;

        // Validate required fields
        if (!username || !password || !firstName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, password, and first name are required' 
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }
        if (!/[a-zA-Z]/.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must contain at least one letter' 
            });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must contain at least one number' 
            });
        }
        if (!/[^a-zA-Z0-9]/.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must contain at least one special character' 
            });
        }

        const users = readUsers();

        // Check if username already exists
        const existingUser = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        // Create new user
        const newUser = {
            id: 'user_' + Date.now() + '_' + uuidv4().substring(0, 8),
            username: username,
            password: password, // In production, hash this!
            firstName: firstName,
            imageUrl: imageUrl || null,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        // Initialize empty playlists for the user
        writeUserPlaylists(newUser.id, []);

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        const users = readUsers();
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Logout (client-side only, but we can have an endpoint for logging)
app.post('/api/auth/logout', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Logout successful' 
    });
});

// Check if username exists
app.get('/api/auth/check-username/:username', (req, res) => {
    try {
        const { username } = req.params;
        const users = readUsers();
        const exists = users.some(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );
        res.json({ exists });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// PLAYLIST ROUTES
// ============================================

// Get all playlists for a user
app.get('/api/playlists/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const playlists = readUserPlaylists(userId);
        res.json({ success: true, playlists });
    } catch (error) {
        console.error('Get playlists error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching playlists' 
        });
    }
});

// Create new playlist
app.post('/api/playlists/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Playlist name is required' 
            });
        }

        const playlists = readUserPlaylists(userId);
        
        const newPlaylist = {
            id: 'playlist_' + Date.now() + '_' + uuidv4().substring(0, 8),
            name: name,
            songs: [],
            createdAt: new Date().toISOString()
        };

        playlists.push(newPlaylist);
        writeUserPlaylists(userId, playlists);

        res.status(201).json({ 
            success: true, 
            playlist: newPlaylist 
        });
    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating playlist' 
        });
    }
});

// Delete playlist
app.delete('/api/playlists/:userId/:playlistId', (req, res) => {
    try {
        const { userId, playlistId } = req.params;
        let playlists = readUserPlaylists(userId);
        
        const playlistIndex = playlists.findIndex(p => p.id === playlistId);
        if (playlistIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Playlist not found' 
            });
        }

        // Delete any uploaded MP3 files associated with this playlist
        const playlist = playlists[playlistIndex];
        playlist.songs.forEach(song => {
            if (song.isLocal && song.filePath) {
                const fullPath = path.join(UPLOADS_DIR, path.basename(song.filePath));
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        });

        playlists = playlists.filter(p => p.id !== playlistId);
        writeUserPlaylists(userId, playlists);

        res.json({ 
            success: true, 
            message: 'Playlist deleted successfully' 
        });
    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting playlist' 
        });
    }
});

// Add song to playlist
app.post('/api/playlists/:userId/:playlistId/songs', (req, res) => {
    try {
        const { userId, playlistId } = req.params;
        const song = req.body;

        const playlists = readUserPlaylists(userId);
        const playlist = playlists.find(p => p.id === playlistId);

        if (!playlist) {
            return res.status(404).json({ 
                success: false, 
                message: 'Playlist not found' 
            });
        }

        // Check if song already exists (by videoId or local file id)
        const songId = song.videoId || song.localId;
        const exists = playlist.songs.some(s => 
            (s.videoId && s.videoId === song.videoId) || 
            (s.localId && s.localId === song.localId)
        );

        if (exists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Song already exists in playlist' 
            });
        }

        const newSong = {
            ...song,
            addedAt: new Date().toISOString(),
            rating: 0
        };

        playlist.songs.push(newSong);
        writeUserPlaylists(userId, playlists);

        res.status(201).json({ 
            success: true, 
            song: newSong 
        });
    } catch (error) {
        console.error('Add song error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding song to playlist' 
        });
    }
});

// Remove song from playlist
app.delete('/api/playlists/:userId/:playlistId/songs/:songId', (req, res) => {
    try {
        const { userId, playlistId, songId } = req.params;

        const playlists = readUserPlaylists(userId);
        const playlist = playlists.find(p => p.id === playlistId);

        if (!playlist) {
            return res.status(404).json({ 
                success: false, 
                message: 'Playlist not found' 
            });
        }

        const songIndex = playlist.songs.findIndex(s => 
            s.videoId === songId || s.localId === songId
        );

        if (songIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Song not found in playlist' 
            });
        }

        // If it's a local file, delete the file
        const song = playlist.songs[songIndex];
        if (song.isLocal && song.filePath) {
            const fullPath = path.join(UPLOADS_DIR, path.basename(song.filePath));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        playlist.songs.splice(songIndex, 1);
        writeUserPlaylists(userId, playlists);

        res.json({ 
            success: true, 
            message: 'Song removed from playlist' 
        });
    } catch (error) {
        console.error('Remove song error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing song from playlist' 
        });
    }
});

// Update song rating
app.patch('/api/playlists/:userId/:playlistId/songs/:songId/rating', (req, res) => {
    try {
        const { userId, playlistId, songId } = req.params;
        const { rating } = req.body;

        const playlists = readUserPlaylists(userId);
        const playlist = playlists.find(p => p.id === playlistId);

        if (!playlist) {
            return res.status(404).json({ 
                success: false, 
                message: 'Playlist not found' 
            });
        }

        const song = playlist.songs.find(s => 
            s.videoId === songId || s.localId === songId
        );

        if (!song) {
            return res.status(404).json({ 
                success: false, 
                message: 'Song not found in playlist' 
            });
        }

        song.rating = rating;
        writeUserPlaylists(userId, playlists);

        res.json({ 
            success: true, 
            message: 'Rating updated' 
        });
    } catch (error) {
        console.error('Update rating error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating rating' 
        });
    }
});

// ============================================
// MP3 UPLOAD ROUTES
// ============================================

// Upload MP3 file and add to playlist
app.post('/api/upload/:userId/:playlistId', upload.single('mp3file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded or invalid file type' 
            });
        }

        const { userId, playlistId } = req.params;
        const playlists = readUserPlaylists(userId);
        const playlist = playlists.find(p => p.id === playlistId);

        if (!playlist) {
            // Delete uploaded file if playlist not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ 
                success: false, 
                message: 'Playlist not found' 
            });
        }

        // Create song entry for the uploaded file
        const fileName = path.basename(req.file.originalname, '.mp3');
        const localSong = {
            localId: 'local_' + Date.now() + '_' + uuidv4().substring(0, 8),
            title: fileName,
            isLocal: true,
            filePath: `/uploads/${req.file.filename}`,
            thumbnail: 'images/mp3-thumbnail.svg',
            duration: 'MP3',
            addedAt: new Date().toISOString(),
            rating: 0
        };

        playlist.songs.push(localSong);
        writeUserPlaylists(userId, playlists);

        res.status(201).json({ 
            success: true, 
            message: 'File uploaded successfully',
            song: localSong
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading file' 
        });
    }
});

// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 20MB.'
            });
        }
    }
    if (error.message === 'Only MP3 files are allowed!') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next(error);
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
});
