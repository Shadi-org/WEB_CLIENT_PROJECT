// Playlists page script
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!Auth.requireAuth()) return;
    Auth.setupNavbar();

    // Elements
    const playlistsList = document.getElementById('playlistsList');
    const newPlaylistBtn = document.getElementById('newPlaylistBtn');
    const currentPlaylistName = document.getElementById('currentPlaylistName');
    const playlistInfo = document.getElementById('playlistInfo');
    const playlistActions = document.getElementById('playlistActions');
    const playlistControls = document.getElementById('playlistControls');
    const songsContainer = document.getElementById('songsContainer');
    const emptyState = document.getElementById('emptyState');
    const filterInput = document.getElementById('filterInput');
    const sortByNameBtn = document.getElementById('sortByName');
    const sortByRatingBtn = document.getElementById('sortByRating');
    const playPlaylistBtn = document.getElementById('playPlaylistBtn');
    const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');

    // Modals
    const createPlaylistModal = new bootstrap.Modal(document.getElementById('createPlaylistModal'));
    const videoModal = document.getElementById('videoModal');
    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    // State
    let currentPlaylistId = null;
    let currentSort = 'name';
    let currentSongs = [];
    let currentPlayingIndex = 0;

    // Initialize
    init();

    function init() {
        loadPlaylists();
        loadFromQueryString();
        setupEventListeners();
    }

    // Load playlists to sidebar
    function loadPlaylists() {
        const playlists = Storage.getUserPlaylists();
        playlistsList.innerHTML = '';

        if (playlists.length === 0) {
            playlistsList.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="bi bi-music-note-list display-6"></i>
                    <p class="mt-2 small">No playlists yet</p>
                </div>
            `;
            return;
        }

        playlists.forEach(playlist => {
            const item = document.createElement('div');
            item.className = `playlist-item ${playlist.id === currentPlaylistId ? 'active' : ''}`;
            item.dataset.playlistId = playlist.id;
            item.innerHTML = `
                <div class="playlist-name">
                    <i class="bi bi-music-note-list"></i>
                    <span>${playlist.name}</span>
                </div>
                <span class="song-count badge bg-secondary">${playlist.songs.length}</span>
            `;
            item.addEventListener('click', () => selectPlaylist(playlist.id));
            playlistsList.appendChild(item);
        });
    }

    // Load from query string
    function loadFromQueryString() {
        const params = new URLSearchParams(window.location.search);
        const playlistId = params.get('playlist');
        
        if (playlistId) {
            const playlist = Storage.getPlaylist(playlistId);
            if (playlist) {
                selectPlaylist(playlistId);
                return;
            }
        }

        // Load first playlist by default
        const playlists = Storage.getUserPlaylists();
        if (playlists.length > 0) {
            selectPlaylist(playlists[0].id);
        }
    }

    // Update query string
    function updateQueryString(playlistId) {
        const url = new URL(window.location);
        if (playlistId) {
            url.searchParams.set('playlist', playlistId);
        } else {
            url.searchParams.delete('playlist');
        }
        window.history.pushState({}, '', url);
    }

    // Select playlist
    function selectPlaylist(playlistId) {
        currentPlaylistId = playlistId;
        const playlist = Storage.getPlaylist(playlistId);

        if (!playlist) {
            showEmptyState();
            return;
        }

        // Update URL
        updateQueryString(playlistId);

        // Update sidebar selection
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.toggle('active', item.dataset.playlistId === playlistId);
        });

        // Update header
        currentPlaylistName.textContent = playlist.name;
        playlistInfo.textContent = `${playlist.songs.length} songs`;
        playlistActions.style.display = 'flex';
        playlistActions.classList.remove('d-none');
        playlistControls.classList.remove('d-none');

        // Store songs and display
        currentSongs = [...playlist.songs];
        displaySongs();
    }

    // Display songs
    function displaySongs(filter = '') {
        let songs = [...currentSongs];

        // Apply filter
        if (filter) {
            const filterLower = filter.toLowerCase();
            songs = songs.filter(song => 
                song.title.toLowerCase().includes(filterLower)
            );
        }

        // Apply sort
        if (currentSort === 'name') {
            songs.sort((a, b) => a.title.localeCompare(b.title, 'en'));
        } else if (currentSort === 'rating') {
            songs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        // Clear container
        songsContainer.innerHTML = '';

        if (songs.length === 0) {
            if (filter) {
                songsContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-search display-4 text-muted"></i>
                        <p class="mt-3 text-muted">No songs match your search</p>
                    </div>
                `;
            } else {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <i class="bi bi-music-note display-1 text-muted"></i>
                    <h4 class="mt-3">Playlist is empty</h4>
                    <p class="text-muted">Add songs from the search page</p>
                    <a href="search.html" class="btn btn-primary mt-2">
                        <i class="bi bi-search me-2"></i>Search Songs
                    </a>
                `;
            }
            return;
        }

        emptyState.style.display = 'none';

        songs.forEach((song, index) => {
            const card = createSongCard(song, index);
            songsContainer.appendChild(card);
        });
    }

    // Create song card
    function createSongCard(song, index) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 col-xl-3';

        col.innerHTML = `
            <div class="card song-card">
                <div class="thumbnail-container">
                    <img src="${song.thumbnail}" class="card-img-top" alt="${song.title}">
                    <i class="bi bi-play-circle-fill play-overlay"></i>
                </div>
                <div class="card-body">
                    <h6 class="card-title" title="${song.title}">${song.title}</h6>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted small">${song.duration || ''}</span>
                        <div class="rating">
                            ${createRatingStars(song.rating || 0, song.videoId)}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger w-100 btn-delete-song" data-video-id="${song.videoId}">
                        <i class="bi bi-trash me-1"></i>Remove
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        const thumbnail = col.querySelector('.thumbnail-container');
        thumbnail.addEventListener('click', () => playVideo(song, index));

        const deleteBtn = col.querySelector('.btn-delete-song');
        deleteBtn.addEventListener('click', () => confirmDeleteSong(song.videoId, song.title));

        // Rating stars
        const ratingInputs = col.querySelectorAll('.rating input');
        ratingInputs.forEach(input => {
            input.addEventListener('change', function() {
                const rating = parseInt(this.value);
                Storage.updateSongRating(currentPlaylistId, song.videoId, rating);
                // Update local song data
                const songInList = currentSongs.find(s => s.videoId === song.videoId);
                if (songInList) songInList.rating = rating;
            });
        });

        return col;
    }

    // Create rating stars HTML
    function createRatingStars(currentRating, videoId) {
        let html = '';
        for (let i = 5; i >= 1; i--) {
            html += `
                <input type="radio" name="rating-${videoId}" value="${i}" id="rating-${videoId}-${i}" ${currentRating === i ? 'checked' : ''}>
                <label for="rating-${videoId}-${i}" title="${i} stars"><i class="bi bi-star-fill"></i></label>
            `;
        }
        return html;
    }

    // Play video
    function playVideo(song, index) {
        currentPlayingIndex = index;
        const player = document.getElementById('videoPlayer');
        const title = document.getElementById('videoTitle');
        
        player.src = YouTubeAPI.getEmbedUrl(song.videoId);
        title.textContent = song.title;
        
        new bootstrap.Modal(videoModal).show();
    }

    // Setup event listeners
    function setupEventListeners() {
        // New playlist button
        newPlaylistBtn.addEventListener('click', () => {
            document.getElementById('playlistNameInput').value = '';
            createPlaylistModal.show();
        });

        // Create playlist confirm
        document.getElementById('confirmCreatePlaylist').addEventListener('click', () => {
            const nameInput = document.getElementById('playlistNameInput');
            const name = nameInput.value.trim();
            
            if (!name) {
                nameInput.classList.add('is-invalid');
                return;
            }
            
            nameInput.classList.remove('is-invalid');
            const newPlaylist = Storage.createPlaylist(name);
            createPlaylistModal.hide();
            loadPlaylists();
            selectPlaylist(newPlaylist.id);
            showToast('New playlist created successfully', 'success');
        });

        // Filter input
        filterInput.addEventListener('input', function() {
            displaySongs(this.value);
        });

        // Sort buttons
        sortByNameBtn.addEventListener('click', function() {
            currentSort = 'name';
            this.classList.add('active');
            sortByRatingBtn.classList.remove('active');
            displaySongs(filterInput.value);
        });

        sortByRatingBtn.addEventListener('click', function() {
            currentSort = 'rating';
            this.classList.add('active');
            sortByNameBtn.classList.remove('active');
            displaySongs(filterInput.value);
        });

        // Play playlist
        playPlaylistBtn.addEventListener('click', () => {
            if (currentSongs.length > 0) {
                playVideo(currentSongs[0], 0);
            }
        });

        // Delete playlist
        deletePlaylistBtn.addEventListener('click', () => {
            const playlist = Storage.getPlaylist(currentPlaylistId);
            if (playlist) {
                confirmDeletePlaylist(playlist);
            }
        });

        // Video modal navigation
        document.getElementById('prevVideoBtn').addEventListener('click', () => {
            if (currentPlayingIndex > 0) {
                currentPlayingIndex--;
                const song = currentSongs[currentPlayingIndex];
                document.getElementById('videoPlayer').src = YouTubeAPI.getEmbedUrl(song.videoId);
                document.getElementById('videoTitle').textContent = song.title;
            }
        });

        document.getElementById('nextVideoBtn').addEventListener('click', () => {
            if (currentPlayingIndex < currentSongs.length - 1) {
                currentPlayingIndex++;
                const song = currentSongs[currentPlayingIndex];
                document.getElementById('videoPlayer').src = YouTubeAPI.getEmbedUrl(song.videoId);
                document.getElementById('videoTitle').textContent = song.title;
            }
        });

        // Stop video on modal close
        videoModal.addEventListener('hidden.bs.modal', () => {
            document.getElementById('videoPlayer').src = '';
        });

        // Handle browser back/forward
        window.addEventListener('popstate', loadFromQueryString);
    }

    // Confirm delete song
    function confirmDeleteSong(videoId, title) {
        document.getElementById('deleteConfirmMessage').textContent = 
            `Are you sure you want to remove "${title}" from the playlist?`;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            Storage.removeSongFromPlaylist(currentPlaylistId, videoId);
            currentSongs = currentSongs.filter(s => s.videoId !== videoId);
            displaySongs(filterInput.value);
            loadPlaylists();
            deleteConfirmModal.hide();
            showToast('Song removed from playlist', 'success');
        });

        deleteConfirmModal.show();
    }

    // Confirm delete playlist
    function confirmDeletePlaylist(playlist) {
        document.getElementById('deleteConfirmMessage').textContent = 
            `Are you sure you want to delete the playlist "${playlist.name}" and all its songs?`;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            Storage.deletePlaylist(currentPlaylistId);
            currentPlaylistId = null;
            currentSongs = [];
            loadPlaylists();
            deleteConfirmModal.hide();
            showToast('Playlist deleted successfully', 'success');
            
            // Load first playlist or show empty state
            const playlists = Storage.getUserPlaylists();
            if (playlists.length > 0) {
                selectPlaylist(playlists[0].id);
            } else {
                showEmptyState();
            }
        });

        deleteConfirmModal.show();
    }

    // Show empty state
    function showEmptyState() {
        currentPlaylistName.textContent = 'Select Playlist';
        playlistInfo.textContent = 'Select a playlist from the list';
        playlistActions.style.display = 'none';
        playlistControls.classList.add('d-none');
        songsContainer.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <i class="bi bi-music-note-list display-1 text-muted"></i>
            <h4 class="mt-3">Select a playlist from the list</h4>
            <p class="text-muted">Or create a new playlist to get started</p>
        `;
        updateQueryString(null);
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        
        if (type === 'success') {
            toastIcon.className = 'bi bi-check-circle-fill text-success me-2';
            toastTitle.textContent = 'Success';
        } else {
            toastIcon.className = 'bi bi-info-circle-fill text-primary me-2';
            toastTitle.textContent = 'Notification';
        }

        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
    }
});
