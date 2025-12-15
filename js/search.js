// Search page script
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!Auth.requireAuth()) return;
    Auth.setupNavbar();

    // Elements
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    const initialState = document.getElementById('initialState');
    
    // Welcome elements
    const welcomeName = document.getElementById('welcomeName');
    const welcomeAvatar = document.getElementById('welcomeAvatar');
    const welcomeAvatarPlaceholder = document.getElementById('welcomeAvatarPlaceholder');

    // Modal elements
    const videoModal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const addToPlaylistModal = document.getElementById('addToPlaylistModal');

    // Current video being added to playlist
    let currentVideoToAdd = null;
    let searchResultsCache = [];

    // Setup welcome section
    setupWelcome();

    // Restore search state if exists
    restoreSearchState();

    // Load search from URL parameters
    loadFromQueryString();

    // Search form submission
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

    // Video modal close - stop video
    videoModal.addEventListener('hidden.bs.modal', function() {
        videoPlayer.src = '';
    });

    // Add to playlist modal events
    setupPlaylistModal();

    // Setup welcome section
    function setupWelcome() {
        const user = Auth.getCurrentUser();
        if (user) {
            welcomeName.textContent = user.firstName;
            if (user.imageUrl) {
                welcomeAvatar.src = user.imageUrl;
                welcomeAvatar.style.display = 'block';
                welcomeAvatarPlaceholder.style.display = 'none';
            }
        }
    }

    // Load search from query string
    function loadFromQueryString() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query) {
            searchInput.value = query;
            performSearch(query);
        }
    }

    // Update query string
    function updateQueryString(query) {
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.pushState({}, '', url);
    }

    // Save search state
    function saveSearchState() {
        const state = {
            query: searchInput.value,
            results: searchResultsCache
        };
        sessionStorage.setItem('searchState', JSON.stringify(state));
    }

    // Restore search state
    function restoreSearchState() {
        const savedState = sessionStorage.getItem('searchState');
        if (savedState) {
            const state = JSON.parse(savedState);
            if (state.query && state.results && state.results.length > 0) {
                searchInput.value = state.query;
                searchResultsCache = state.results;
                displayResults(state.results);
                updateQueryString(state.query);
            }
        }
    }

    // Perform search
    async function performSearch(query) {
        // Update query string
        updateQueryString(query);

        // Show loading
        showLoading();

        try {
            const results = await YouTubeAPI.search(query);
            searchResultsCache = results;
            
            // Save state
            saveSearchState();

            if (results.length === 0) {
                showNoResults();
            } else {
                displayResults(results);
            }
        } catch (error) {
            console.error('Search error:', error);
            showError('An error occurred while searching. Please try again later.');
        }
    }

    // Display results
    function displayResults(results) {
        hideAllStates();
        searchResults.innerHTML = '';

        results.forEach(video => {
            const isInFavorites = Storage.isVideoInFavorites(video.videoId);
            const card = createVideoCard(video, isInFavorites);
            searchResults.appendChild(card);
        });
    }

    // Create video card
    function createVideoCard(video, isInFavorites) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 col-xl-3';

        const truncatedTitle = video.title.length > 60 ? video.title.substring(0, 60) + '...' : video.title;
        const needsTooltip = video.title.length > 60;

        col.innerHTML = `
            <div class="card video-card">
                <div class="thumbnail-container position-relative">
                    ${isInFavorites ? '<div class="in-favorites"><i class="bi bi-check"></i></div>' : ''}
                    <img src="${video.thumbnail}" class="card-img-top" alt="${video.title}" data-video-id="${video.videoId}">
                    <span class="duration-badge">${video.duration}</span>
                </div>
                <div class="card-body">
                    <h6 class="card-title" ${needsTooltip ? `title="${video.title}" data-bs-toggle="tooltip"` : ''} data-video-id="${video.videoId}">
                        ${truncatedTitle}
                    </h6>
                    <p class="video-stats mb-2">
                        <i class="bi bi-eye me-1"></i>${YouTubeAPI.formatViewCount(video.viewCount)} צפיות
                    </p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary flex-grow-1 btn-play" data-video-id="${video.videoId}" data-title="${video.title}">
                            <i class="bi bi-play-fill"></i> נגן
                        </button>
                        <button class="btn btn-sm ${isInFavorites ? 'btn-add-favorite added' : 'btn-outline-danger btn-add-favorite'}" 
                                data-video='${JSON.stringify(video).replace(/'/g, "&#39;")}'>
                            <i class="bi ${isInFavorites ? 'bi-check' : 'bi-heart'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const playBtn = col.querySelector('.btn-play');
        const thumbnail = col.querySelector('.card-img-top');
        const title = col.querySelector('.card-title');
        const addFavoriteBtn = col.querySelector('.btn-add-favorite');

        // Play video
        const playVideo = () => {
            const videoId = playBtn.dataset.videoId;
            const videoTitleText = playBtn.dataset.title;
            videoPlayer.src = YouTubeAPI.getEmbedUrl(videoId);
            videoTitle.textContent = videoTitleText;
            new bootstrap.Modal(videoModal).show();
        };

        playBtn.addEventListener('click', playVideo);
        thumbnail.addEventListener('click', playVideo);
        title.addEventListener('click', playVideo);

        // Add to favorites
        if (!isInFavorites) {
            addFavoriteBtn.addEventListener('click', function() {
                currentVideoToAdd = JSON.parse(this.dataset.video.replace(/&#39;/g, "'"));
                openAddToPlaylistModal();
            });
        }

        // Initialize tooltips
        const tooltipElements = col.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipElements.forEach(el => new bootstrap.Tooltip(el));

        return col;
    }

    // Setup playlist modal
    function setupPlaylistModal() {
        const existingPlaylistSelect = document.getElementById('existingPlaylist');
        const newPlaylistInput = document.getElementById('newPlaylistName');
        const createPlaylistBtn = document.getElementById('createPlaylistBtn');
        const confirmAddBtn = document.getElementById('confirmAddToPlaylist');

        // Create new playlist from modal
        createPlaylistBtn.addEventListener('click', function() {
            const name = newPlaylistInput.value.trim();
            if (name) {
                const newPlaylist = Storage.createPlaylist(name);
                refreshPlaylistDropdown();
                existingPlaylistSelect.value = newPlaylist.id;
                newPlaylistInput.value = '';
            }
        });

        // Confirm add to playlist
        confirmAddBtn.addEventListener('click', function() {
            const playlistId = existingPlaylistSelect.value;
            if (!playlistId) {
                alert('Please select a playlist');
                return;
            }

            if (currentVideoToAdd) {
                const added = Storage.addSongToPlaylist(playlistId, currentVideoToAdd);
                if (added) {
                    // Close modal
                    bootstrap.Modal.getInstance(addToPlaylistModal).hide();

                    // Get playlist name
                    const playlist = Storage.getPlaylist(playlistId);

                    // Show toast notification
                    showToast(`Song added to playlist "${playlist.name}"`, playlistId);

                    // Refresh results to show checkmark
                    displayResults(searchResultsCache);
                } else {
                    alert('This song is already in this playlist');
                }
            }
        });
    }

    // Open add to playlist modal
    function openAddToPlaylistModal() {
        if (!currentVideoToAdd) return;

        // Update modal content
        document.getElementById('modalVideoThumbnail').src = currentVideoToAdd.thumbnail;
        document.getElementById('modalVideoTitle').textContent = currentVideoToAdd.title;

        // Refresh playlist dropdown
        refreshPlaylistDropdown();

        // Clear new playlist input
        document.getElementById('newPlaylistName').value = '';

        // Show modal
        new bootstrap.Modal(addToPlaylistModal).show();
    }

    // Refresh playlist dropdown
    function refreshPlaylistDropdown() {
        const select = document.getElementById('existingPlaylist');
        const playlists = Storage.getUserPlaylists();

        select.innerHTML = '<option value="">-- בחר פלייליסט --</option>';
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = playlist.name;
            select.appendChild(option);
        });
    }

    // Show toast notification
    function showToast(message, playlistId) {
        const toast = document.getElementById('notificationToast');
        const toastMessage = document.getElementById('toastMessage');
        const toastPlaylistLink = document.getElementById('toastPlaylistLink');

        toastMessage.textContent = message;
        toastPlaylistLink.href = `playlists.html?playlist=${playlistId}`;

        const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();
    }

    // UI state functions
    function showLoading() {
        hideAllStates();
        loadingSpinner.classList.remove('d-none');
    }

    function showNoResults() {
        hideAllStates();
        noResults.classList.remove('d-none');
    }

    function showError(message) {
        hideAllStates();
        searchResults.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                <h4 class="mt-3">Error</h4>
                <p class="text-muted">${message}</p>
            </div>
        `;
    }

    function hideAllStates() {
        loadingSpinner.classList.add('d-none');
        noResults.classList.add('d-none');
        initialState.classList.add('d-none');
    }

    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        loadFromQueryString();
    });
});
