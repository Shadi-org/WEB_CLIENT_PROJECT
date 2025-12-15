// YouTube Data API helper functions
const YouTubeAPI = {
    // API Key - Replace with your own API key
    API_KEY: 'AIzaSyB62KIA5JoMUh4e8grwCqne3QTLFmmKyHk',
    
    // Base URLs
    SEARCH_URL: 'https://www.googleapis.com/youtube/v3/search',
    VIDEO_URL: 'https://www.googleapis.com/youtube/v3/videos',

    // Search videos
    search: async function(query, maxResults = 12) {
        try {
            const params = new URLSearchParams({
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: maxResults,
                key: this.API_KEY
            });

            const response = await fetch(`${this.SEARCH_URL}?${params}`);
            const data = await response.json();

            if (data.error) {
                console.error('YouTube API Error:', data.error);
                throw new Error(data.error.message);
            }

            // Get video IDs for additional details
            const videoIds = data.items.map(item => item.id.videoId).join(',');
            const videoDetails = await this.getVideoDetails(videoIds);

            // Merge search results with video details
            return data.items.map(item => {
                const details = videoDetails.find(v => v.id === item.id.videoId);
                return {
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    thumbnailHigh: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt,
                    duration: details?.duration || 'N/A',
                    viewCount: details?.viewCount || 0
                };
            });
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    },

    // Get video details (duration, view count)
    getVideoDetails: async function(videoIds) {
        try {
            const params = new URLSearchParams({
                part: 'contentDetails,statistics',
                id: videoIds,
                key: this.API_KEY
            });

            const response = await fetch(`${this.VIDEO_URL}?${params}`);
            const data = await response.json();

            if (data.error) {
                console.error('YouTube API Error:', data.error);
                return [];
            }

            return data.items.map(item => ({
                id: item.id,
                duration: this.formatDuration(item.contentDetails.duration),
                viewCount: parseInt(item.statistics.viewCount || 0)
            }));
        } catch (error) {
            console.error('Get video details error:', error);
            return [];
        }
    },

    // Format ISO 8601 duration to readable format
    formatDuration: function(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // Format view count
    formatViewCount: function(count) {
        if (count >= 1000000000) {
            return (count / 1000000000).toFixed(1) + 'B';
        }
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    },

    // Get embed URL for video
    getEmbedUrl: function(videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
};
