# Web Client Project - Server Side Branch

Music playlist application with server-side authentication and playlist management.

## Project Structure

```
├── server/             # Server-side code
│   └── server.js       # Express.js server
├── client/             # Client-side code
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   │   ├── api.js      # API service for server communication
│   │   ├── auth.js     # Authentication helpers
│   │   ├── login.js    # Login page script
│   │   ├── register.js # Registration page script
│   │   ├── search.js   # Search page script
│   │   ├── playlists.js# Playlists page script
│   │   ├── storage.js  # Storage helpers (server API)
│   │   └── youtube-api.js # YouTube API helpers
│   ├── images/         # Static images
│   └── *.html          # HTML pages
├── data/               # Server data storage
│   ├── users.json      # User accounts
│   ├── playlists/      # User playlist files
│   └── uploads/        # Uploaded MP3 files
└── package.json        # Project dependencies
```

## Features

- **Server-side Authentication**: Register, Login, Logout via REST API
- **Server-side Playlist Management**: Playlists stored as JSON files per user
- **MP3 File Upload**: Upload local MP3 files to playlists
- **YouTube Integration**: Search and add YouTube videos to playlists
- **Rating System**: Rate songs in playlists

## Installation

```bash
npm install
```

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/check-username/:username` - Check if username exists

### Playlists
- `GET /api/playlists/:userId` - Get all playlists for user
- `POST /api/playlists/:userId` - Create new playlist
- `DELETE /api/playlists/:userId/:playlistId` - Delete playlist
- `POST /api/playlists/:userId/:playlistId/songs` - Add song to playlist
- `DELETE /api/playlists/:userId/:playlistId/songs/:songId` - Remove song
- `PATCH /api/playlists/:userId/:playlistId/songs/:songId/rating` - Update rating

### File Upload
- `POST /api/upload/:userId/:playlistId` - Upload MP3 file to playlist
