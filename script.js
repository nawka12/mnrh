import { HolodexApiClient } from 'holodex.js';

// At the top of the file, after imports
console.log('Script loaded');

// Initialize both clients
let holodexClient = null;

// Add this constant for the music playlist
const MUSIC_PLAYLIST_ID = 'PLdcktSYecSKfeQ7p5CrVO4avrmLzSL8mt';

// Add this constant with the playlist songs
const MUSIC_PLAYLIST_SONGS = [
    {
        videoId: '47hoUcGoZTI',
        title: 'Moona Hoshinova - Nightmare',
        publishedAt: '2024-12-09'
    },
    {
        videoId: '8fSdl2kWrHg',
        title: 'Moona Hoshinova - Multiverse',
        publishedAt: '2024-11-11'
    },
    {
        videoId: 'cU5_JIEFTOw',
        title: 'Moona Hoshinova - DEJAVU',
        publishedAt: '2024-04-11'
    },
    {
        videoId: 'qTr2x78_u4k',
        title: 'Moona Hoshinova - Taut Hati',
        publishedAt: '2024-01-06'
    },
    {
        videoId: 'PFoGNZ05CJw',
        title: "Moona Hoshinova - Who's Toxic? It's You!",
        publishedAt: '2023-04-11'
    },
    {
        videoId: 'LXRSp8QbOeg',
        title: 'Moona Hoshinova - Perisai Jitu',
        publishedAt: '2022-11-25'
    },
    {
        videoId: 'stmZAThUl64',
        title: 'Moona Hoshinova - High Tide',
        publishedAt: '2022-02-15'
    },
    {
        videoId: 'q4N7EhUWOAA',
        title: 'Moona Hoshinova - Ai no Chiisana Uta',
        publishedAt: '2021-02-16'
    },
    {
        videoId: 'N_1xVr7wp6Q',
        title: 'Moona Hoshinova - KSZK',
        publishedAt: '2020-06-29'
    }
];

// Add these helper functions near the top of the file
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

async function initializeHolodexClient() {
    console.log('initializeHolodexClient called');
    // Always create a new client, regardless of existing one
    try {
        console.log('Creating new Holodex client...');
        holodexClient = new HolodexApiClient({
            apiKey: 'aa758d74-e7ac-46ef-9d99-f7ebc8d033a1'
        });
        console.log('Holodex client created successfully');
        return holodexClient;
    } catch (error) {
        console.error('Failed to initialize Holodex client:', error);
        return null;
    }
}

const MOONA_CHANNEL_ID = 'UCP0BspO_AMEe3aQqqpo89Dg';
const TWITTER_USERNAME = 'moonahoshinova';

let lastUpdateTime = null;
const UPDATE_INTERVAL = 1 * 60 * 1000; // 1 minutes in milliseconds

const CACHE_DURATION = 1 * 60 * 1000; // 1 minutes in milliseconds

const cache = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const { value, timestamp, fetchTime } = JSON.parse(item);
            if (Date.now() - timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
                return null;
            }

            // Convert date strings back to Date objects for Holodex API responses
            if (Array.isArray(value)) {
                return value.map(item => {
                    // If it's a video object
                    if (item.videoId || item.raw?.id) {
                        // For all videos, consistently use published_at as the main timestamp
                        const publishedTime = item.raw?.published_at || item.published_at;
                        
                        return {
                            ...item,
                            videoId: item.videoId || item.raw?.id,
                            title: item.title || item.raw?.title,
                            // Always use published_at for the display time
                            publishedAt: publishedTime ? new Date(publishedTime) : null,
                            // Keep other dates for reference
                            actualStart: item.raw?.published_at ? new Date(item.raw.published_at) : null,
                            scheduledStart: item.raw?.start_scheduled ? new Date(item.raw.start_scheduled) : null,
                            status: item.status || item.raw?.status
                        };
                    }
                    return item;
                });
            }
            return value;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    },
    set: (key, value) => {
        try {
            const item = {
                value,
                timestamp: Date.now(),
                fetchTime: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    }
};

function updateTimeCounter(latestActivity) {
    const counterElement = document.getElementById('timeCounter');
    
    function update() {
        const now = new Date();
        const diff = now - latestActivity;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        counterElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    // Update immediately and then every second
    update();
    return setInterval(update, 1000);
}

function updateCacheStatus() {
    const cacheStatus = {};
    let latestFetchTime = 0;

    // Check each cache item
    ['liveVideos', 'recentVideos', 'tweets'].forEach(key => {
        try {
            const item = localStorage.getItem(key);
            if (item) {
                const { timestamp, fetchTime } = JSON.parse(item);
                cacheStatus[key] = Date.now() - timestamp > CACHE_DURATION ? 'Live' : 'Cached';
                // Track the most recent fetch time
                if (fetchTime > latestFetchTime) {
                    latestFetchTime = fetchTime;
                }
            } else {
                cacheStatus[key] = 'Live';
            }
        } catch (error) {
            cacheStatus[key] = 'Live';
        }
    });

    document.getElementById('lastUpdate').innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-2">
            <span>Last updated: ${latestFetchTime ? new Date(latestFetchTime).toLocaleTimeString() : 'Never'}</span>
            <span class="text-xs">
                (Live: ${cacheStatus.liveVideos} | 
                 Videos: ${cacheStatus.recentVideos} | 
                 Tweets: ${cacheStatus.tweets})
            </span>
        </div>
    `;
}

async function checkLiveStatus() {
    // Show loading state
    document.getElementById('liveStatus').innerHTML = `
        <div class="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
            <p class="text-gray-600">Loading...</p>
        </div>
    `;
    
    try {
        const now = new Date();
        lastUpdateTime = now;

        async function getThumbnailUrl(videoId) {
            if (!videoId) return '';
            try {
                const maxRes = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
                const response = await fetch(maxRes, { method: 'HEAD' });
                return response.ok ? maxRes : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            } catch (error) {
                return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            }
        }

        const getCachedOrFetch = async (key, fetchFn) => {
            try {
                console.log(`Fetching ${key}...`);
                const cachedData = cache.get(key);
                if (cachedData) {
                    console.log(`Found cached data for ${key}`);
                    return cachedData;
                }
                
                if (key.includes('Videos')) {
                    // Initialize client if needed
                    console.log(`Initializing client for ${key}`);
                    holodexClient = await initializeHolodexClient();
                    if (!holodexClient) {
                        throw new Error('Holodex client not initialized');
                    }
                }
                
                console.log(`Fetching fresh data for ${key}`);
                const data = await fetchFn();
                console.log(`Received data for ${key}:`, data);
                
                if (!data) {
                    throw new Error(`No data returned for ${key}`);
                }
                
                cache.set(key, data);
                return data;
            } catch (error) {
                console.error(`Error in getCachedOrFetch for ${key}:`, error);
                // Return empty array but also show error in UI
                document.getElementById('liveStatus').innerHTML = `
                    <div class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                        <p class="text-red-600">Error loading data: ${error.message}</p>
                    </div>
                `;
                return [];
            }
        };

        const [liveVideos, recentVideos, tweets] = await Promise.all([
            getCachedOrFetch('liveVideos', async () => {
                const client = await initializeHolodexClient();
                return client.getLiveVideosByChannelId(MOONA_CHANNEL_ID);
            }),
            getCachedOrFetch('recentVideos', async () => {
                const client = await initializeHolodexClient();
                return client.getVideosByChannelId(MOONA_CHANNEL_ID, 'videos', { limit: 15 });
            }),
            getCachedOrFetch('tweets', getTweets)
        ]);

        // Move updateCacheStatus() here, after data is fetched
        updateCacheStatus();

        // Add this debug log
        console.log('Retrieved data:', { liveVideos, recentVideos, tweets });

        // Filter out live and upcoming streams from recent videos
        const filteredRecentVideos = recentVideos
            .filter(video => 
                video.status !== 'live' && 
                video.status !== 'upcoming'
            )
            .slice(0, 5);

        // Add this debug log
        console.log('Filtered videos:', filteredRecentVideos);

        // Get the latest activity time from videos and tweets
        let latestActivity = null;
        
        // Check videos first
        if (filteredRecentVideos.length > 0) {
            const latestVideo = filteredRecentVideos[0];
            if (latestVideo.publishedAt) {
                latestActivity = new Date(latestVideo.publishedAt);
            }
        }
        
        // Check tweets and compare with video date
        if (tweets.length > 0) {
            const latestTweet = new Date(tweets[0].timestamp * 1000);
            if (!latestActivity || latestTweet > latestActivity) {
                latestActivity = latestTweet;
            }
        }

        // Update the time counter if we found an activity
        if (latestActivity) {
            // Clear existing interval if any
            if (window.timeCounterInterval) {
                clearInterval(window.timeCounterInterval);
            }
            window.timeCounterInterval = updateTimeCounter(latestActivity);
        }

        if (liveVideos && liveVideos.length > 0) {
            const liveStreams = liveVideos.filter(stream => stream.status === 'live');
            const upcomingStreams = liveVideos
                .filter(stream => stream.status === 'upcoming')
                .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
                .slice(0, 5);
            
            let html = `
                <style>
                    .grid-container {
                        display: flex;
                        overflow-x: auto;
                        gap: 0.75rem;
                        padding: 0.75rem;
                        scroll-snap-type: x mandatory;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        margin: 0;
                        width: 100%;
                        max-width: 100%;
                        box-sizing: border-box;
                    }
                    .grid-container::-webkit-scrollbar {
                        height: 4px;
                    }
                    .grid-container::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                    }
                    .grid-container::-webkit-scrollbar-thumb {
                        background: #888;
                        border-radius: 4px;
                    }
                    .grid-item {
                        flex: 0 0 calc(85% - 1rem);
                        max-width: calc(85% - 1rem);
                        scroll-snap-align: start;
                        border-radius: 12px;
                        overflow: hidden;
                        padding: 1rem;
                    }
                    @media (min-width: 640px) {
                        .grid-container {
                            gap: 1rem;
                            padding: 1rem;
                        }
                        .grid-item {
                            flex: 0 0 350px;
                            max-width: 350px;
                            padding: 1.5rem;
                        }
                    }
                    .stream-thumbnail {
                        aspect-ratio: 16/9;
                        object-fit: cover;
                        width: 100%;
                    }
                    @media (min-width: 640px) {
                        .grid-container {
                            margin: 0;
                            gap: 1rem;
                        }
                        .grid-item {
                            flex: 0 0 350px;
                            max-width: 350px;
                        }
                    }
                    @media (max-width: 640px) {
                        .content-container {
                            padding-left: 0.75rem;
                            padding-right: 0.75rem;
                        }
                        .time-counter {
                            font-size: 1.125rem;
                        }
                        h1, h2, h3 {
                            word-break: break-word;
                        }
                        .grid-item {
                            margin-bottom: 0.5rem;
                        }
                    }
                </style>
                <div class="grid-container">
            `;

            if (liveStreams.length > 0) {
                for (const stream of liveStreams) {
                    const videoId = stream.raw?.id;
                    const title = stream.raw?.title;
                    const actualStart = stream.actualStart || new Date(stream.raw?.published_at);
                    const liveViewers = stream.raw?.live_viewers;

                    html += `
                        <div class="grid-item bg-red-50 border-2 border-red-500 p-3 md:p-6 shadow-lg">
                            <h2 class="text-lg md:text-2xl font-bold text-red-600 mb-2">🔴 Live Now</h2>
                            <h3 class="text-base md:text-xl font-semibold text-gray-800 mb-2 line-clamp-2">${title}</h3>
                            <div class="relative">
                                <img class="stream-thumbnail rounded-lg shadow-md" 
                                     src="https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg" 
                                     onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'"
                                     onload="if(this.naturalWidth < 200) this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'"
                                     alt="Stream thumbnail"
                                     loading="lazy">
                            </div>
                            <div class="space-y-1 my-2">
                                <p class="text-xs md:text-sm text-gray-700">Started: ${actualStart ? formatDateTime(actualStart) : 'N/A'}</p>
                                <p class="text-xs md:text-sm text-gray-700">Viewers: ${liveViewers?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <a href="https://youtube.com/watch?v=${videoId}" 
                               target="_blank" 
                               class="inline-block w-full text-center bg-red-600 text-white px-4 py-2 text-sm md:text-base rounded-lg hover:bg-red-700 transition-colors touch-feedback">
                                Watch Stream
                            </a>
                        </div>
                    `;
                }
            }

            if (upcomingStreams.length > 0) {
                for (const stream of upcomingStreams) {
                    const videoId = stream.raw?.id;
                    const title = stream.raw?.title;
                    const scheduledStart = stream.scheduledStart || new Date(stream.raw?.scheduled_start);
                    
                    html += `
                        <div class="grid-item bg-gray-50 border-2 border-gray-300 rounded-lg p-4 md:p-6 shadow-lg">
                            <h2 class="text-xl md:text-2xl font-bold text-gray-700 mb-2">⏰ Upcoming Stream</h2>
                            <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-3">${title}</h3>
                            <img class="w-full stream-thumbnail rounded-lg mb-4 shadow-md" 
                                 src="https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg" 
                                 onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'"
                                 onload="if(this.naturalWidth < 200) this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'"
                                 alt="Stream thumbnail">
                            <div class="space-y-1 mb-4">
                                <p class="text-sm md:text-base text-gray-700">Scheduled for: ${scheduledStart ? formatDateTime(scheduledStart) : 'N/A'}</p>
                            </div>
                            <a href="https://youtube.com/watch?v=${videoId}" 
                               target="_blank" 
                               class="inline-block bg-gray-600 text-white px-4 py-2 text-sm md:text-base rounded-lg hover:bg-gray-700 transition-colors">
                                Set Reminder
                            </a>
                        </div>
                    `;
                }
            }

            html += '</div>';

            // Recent videos section
            if (filteredRecentVideos.length > 0) {
                html += `
                    <h2 class="text-xl md:text-2xl font-bold text-gray-700 my-6">Recent Videos</h2>
                    <div class="grid-container">
                `;
                for (const video of filteredRecentVideos) {
                    html += `
                        <div class="grid-item bg-gray-50 border-2 border-gray-300 rounded-lg p-4 md:p-6 shadow-lg">
                            <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-3">${video.title}</h3>
                            <img class="w-full stream-thumbnail rounded-lg mb-4 shadow-md" 
                                 src="https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg" 
                                 onerror="this.src='https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg'"
                                 onload="if(this.naturalWidth < 200) this.src='https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg'"
                                 alt="Video thumbnail">
                            <div class="space-y-1 mb-4">
                                <p class="text-sm md:text-base text-gray-700">Published: ${video.publishedAt ? formatDateTime(video.publishedAt) : 'N/A'}</p>
                            </div>
                            <a href="https://youtube.com/watch?v=${video.videoId}" 
                               target="_blank" 
                               class="inline-block bg-gray-600 text-white px-4 py-2 text-sm md:text-base rounded-lg hover:bg-gray-700 transition-colors">
                                Watch Video
                            </a>
                        </div>
                    `;
                }
                html += '</div>';
            }

            // Add tweets section after recent videos
            if (tweets.length > 0) {
                html += `
                    <h2 class="text-xl md:text-2xl font-bold text-gray-700 my-6">Recent Tweets</h2>
                    <div class="grid-container">
                `;
                for (const tweet of tweets) {
                    html += `
                        <div class="grid-item bg-gray-50 border-2 border-gray-300 rounded-lg p-4 md:p-6 shadow-lg">
                            <div class="flex items-center mb-2">
                                ${tweet.isRetweet ? 
                                    `<span class="text-gray-600 text-sm">🔄 Retweeted from ${tweet.originalAuthor}</span>` :
                                    tweet.isReply ?
                                    `<span class="text-gray-600 text-sm">↩️ Replying to ${tweet.replyTo}</span>` :
                                    tweet.isSpace ?
                                    `<span class="text-gray-600 text-sm">🎙️ Twitter Space</span>` :
                                    tweet.isQuote ?
                                    `<span class="text-gray-600 text-sm">💬 Quote Tweet</span>` :
                                    `<span class="text-gray-600 text-sm">${tweet.originalAuthor}</span>`
                                }
                            </div>
                            <p class="text-sm md:text-base text-gray-700 mb-3">${formatTweetText(tweet.text)}</p>
                            
                            ${tweet.quotedTweet ? `
                                <div class="border rounded-lg p-3 mb-3 bg-gray-50">
                                    <p class="text-sm text-gray-600 mb-1">@${tweet.quotedTweet.author}</p>
                                    <a href="https://x.com/${tweet.quotedTweet.author}/status/${tweet.quotedTweet.id}" 
                                       target="_blank" 
                                       class="text-sm text-blue-500 hover:underline">
                                        View quoted tweet
                                    </a>
                                </div>
                            ` : ''}

                            ${tweet.spaceInfo ? `
                                <div class="border rounded-lg p-3 mb-3 bg-blue-50">
                                    <p class="text-sm font-semibold text-blue-600 mb-2">🎙️ Twitter Space</p>
                                    <a href="${tweet.spaceInfo.url}" 
                                       target="_blank" 
                                       class="inline-block bg-blue-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-600 transition-colors touch-feedback">
                                        Join Space
                                    </a>
                                </div>
                            ` : ''}

                            ${tweet.media.length > 0 ? `
                                <div class="mb-3 ${tweet.media.length > 1 ? 'grid grid-cols-2 gap-2' : ''}">
                                    ${tweet.media.map(item => {
                                        if (item.type === 'video') {
                                            return `
                                                <video autoplay loop muted playsinline 
                                                       class="rounded-lg w-full object-contain"
                                                       style="max-height: 400px;">
                                                    <source src="${item.url}" type="video/mp4">
                                                </video>
                                            `;
                                        } else {
                                            return `
                                                <img src="${item.url}" 
                                                     alt="Tweet media" 
                                                     class="rounded-lg w-full object-contain"
                                                     style="max-height: 400px;"
                                                     loading="lazy">
                                            `;
                                        }
                                    }).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="space-y-1 mb-4">
                                <p class="text-xs text-gray-600">Posted: ${formatDateTime(new Date(tweet.timestamp * 1000))}</p>
                            </div>
                            <a href="https://x.com/${tweet.originalAuthor.substring(1)}/status/${tweet.id}" 
                               target="_blank" 
                               class="inline-block bg-blue-500 text-white px-4 py-2 text-sm md:text-base rounded-lg hover:bg-blue-600 transition-colors touch-feedback">
                                View Tweet
                            </a>
                        </div>
                    `;
                }
                html += '</div>';
            }

            // Add music playlist section
            html += `
                <h2 class="text-xl md:text-2xl font-bold text-gray-700 my-6">Original Songs</h2>
                <div class="grid-container">
                    ${MUSIC_PLAYLIST_SONGS.map(song => `
                        <div class="grid-item bg-gray-50 border-2 border-gray-300 rounded-lg p-4 md:p-6 shadow-lg">
                            <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-3">${song.title}</h3>
                            <div class="aspect-video mb-4">
                                <img class="w-full stream-thumbnail rounded-lg mb-4 shadow-md" 
                                     src="https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg" 
                                     onerror="this.src='https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg'"
                                     onload="if(this.naturalWidth < 200) this.src='https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg'"
                                     alt="Song thumbnail">
                            </div>
                            <div class="space-y-1 mb-4">
                                <p class="text-sm md:text-base text-gray-700">Published: ${formatDate(song.publishedAt)}</p>
                            </div>
                            <a href="https://youtube.com/watch?v=${song.videoId}" 
                               target="_blank" 
                               class="inline-block bg-gray-600 text-white px-4 py-2 text-sm md:text-base rounded-lg hover:bg-gray-700 transition-colors">
                                Listen Now
                            </a>
                        </div>
                    `).join('')}
                </div>
            `;

            const statusDiv = document.getElementById('liveStatus');
            if (!statusDiv) {
                console.error('Could not find liveStatus element');
                return;
            }

            statusDiv.innerHTML = html;

            if (liveStreams.length > 0) {
                // Clear existing interval if any
                if (window.timeCounterInterval) {
                    clearInterval(window.timeCounterInterval);
                }
                // Set counter text to "MOONA ON SIGHT!"
                document.getElementById('timeCounter').textContent = 'MOONA ON SIGHT!';
            } else {
                // Regular time counter update for non-live state
                if (latestActivity) {
                    if (window.timeCounterInterval) {
                        clearInterval(window.timeCounterInterval);
                    }
                    window.timeCounterInterval = updateTimeCounter(latestActivity);
                }
            }
        } else {
            statusDiv.innerHTML = `
                <div class="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 shadow-lg mb-8">
                    <h2 class="text-2xl font-bold text-gray-700 mb-4">⚫ Moona is currently offline</h2>
                    <p class="text-gray-600 mb-4">
                        Check back later or follow her 
                        <a href="https://youtube.com/channel/${MOONA_CHANNEL_ID}" 
                           target="_blank"
                           class="text-blue-600 hover:text-blue-800 underline">
                            YouTube channel
                        </a>
                        for updates!
                    </p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('liveStatus').innerHTML = `
            <div class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-600">Error checking live status</p>
            </div>
        `;
        document.getElementById('timeCounter').textContent = 'Error loading time';
    }
}

// Helper function to get tweets
async function getTweets() {
    const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];

    for (const proxy of corsProxies) {
        try {
            const response = await fetch(proxy + 
                // encodeURIComponent(`https://nitter.privacydev.net/${TWITTER_USERNAME}/with_replies/rss`));
                encodeURIComponent(`https://nitter.privacydev.net/${TWITTER_USERNAME}/rss`));
            if (!response.ok) {
                console.warn(`Proxy ${proxy} failed with status: ${response.status}`);
                continue;
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            
            // Verify that we got valid XML
            if (xml.getElementsByTagName('parsererror').length > 0) {
                console.warn(`Proxy ${proxy} returned invalid XML`);
                continue;
            }

            const items = xml.querySelectorAll('item');
            if (!items || items.length === 0) {
                console.warn(`Proxy ${proxy} returned no items`);
                continue;
            }

            // Rest of the tweet processing code remains the same
            const tweets = [];
            for (let i = 0; i < Math.min(5, items.length); i++) {
                try {
                    const item = items[i];
                    const title = item.querySelector('title')?.textContent || '';
                    const creator = item.querySelector('creator')?.textContent || `@${TWITTER_USERNAME}`;
                    const description = item.querySelector('description')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '';
                    const pubDate = item.querySelector('pubDate')?.textContent;
                    
                    if (!link || !pubDate) continue;
                    
                    const id = link.split('/status/')[1]?.split('#')[0];
                    if (!id) continue;

                    // Parse the description to extract text and links
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = description;
                    
                    // Get all paragraphs and links
                    const paragraphs = tempDiv.querySelectorAll('p');
                    const firstLink = tempDiv.querySelector('a')?.href;
                    
                    // Check if this is a Space
                    let isSpace = false;
                    let spaceInfo = null;
                    let mainText = '';
                    let isQuote = false;
                    let quotedTweet = null;

                    if (firstLink && (firstLink.includes('/spaces/') || title.includes('/spaces/'))) {
                        isSpace = true;
                        const spaceId = (firstLink || title).split('/spaces/')[1]?.split(/[/#]/)[0];
                        spaceInfo = {
                            id: spaceId,
                            url: `https://twitter.com/i/spaces/${spaceId}`
                        };
                        mainText = '🎙️ Started a Twitter Space';
                    } else {
                        // Regular tweet processing
                        mainText = paragraphs[0]?.textContent || '';
                        
                        // Check for quote tweet in second paragraph
                        if (paragraphs[1]) {
                            const quoteLink = paragraphs[1].querySelector('a')?.href;
                            if (quoteLink && !quoteLink.includes('/spaces/')) {
                                isQuote = true;
                                const quotedId = quoteLink.split('/status/')[1]?.split('#')[0];
                                const quotedAuthor = quoteLink.split('/')[3];
                                quotedTweet = {
                                    id: quotedId,
                                    author: quotedAuthor,
                                    text: ''
                                };
                            }
                        }
                    }

                    // Process media as before
                    const media = Array.from(tempDiv.querySelectorAll('img, video'))
                        .map(element => {
                            let originalUrl = '';
                            
                            if (element.tagName.toLowerCase() === 'video') {
                                // Get URL from source element inside video
                                const source = element.querySelector('source');
                                originalUrl = source?.getAttribute('src') || '';
                                console.log('Video source URL:', originalUrl); // Debug log
                                
                                // Extract video filename from Nitter URL
                                const videoMatch = originalUrl.match(/video\.twimg\.com%2Ftweet_video%2F([^.]+\.mp4)/);
                                console.log('Video match:', videoMatch); // Debug log
                                
                                if (videoMatch) {
                                    const videoUrl = `https://video.twimg.com/tweet_video/${videoMatch[1]}`;
                                    console.log('Converted video URL:', videoUrl); // Debug log
                                    return {
                                        type: 'video',
                                        url: videoUrl
                                    };
                                }
                            } else {
                                // Handle images
                                originalUrl = element.src || '';
                                const mediaMatch = originalUrl.match(/\/media%2F([^.]+\.[^?]+)/);
                                if (mediaMatch) {
                                    const imageUrl = `https://pbs.twimg.com/media/${mediaMatch[1]}`; // Create the image URL
                                    return {
                                        type: 'image',
                                        url: imageUrl
                                    };
                                }
                            }
                            return null;
                        })
                        .filter(Boolean);
                    
                    const isRetweet = title.startsWith('RT by');
                    const isReply = title.startsWith('R to');
                    let replyTo = '';
                    
                    if (isReply) {
                        replyTo = title.split('R to ')[1].split(':')[0].trim();
                    }

                    tweets.push({
                        id,
                        text: mainText,
                        isRetweet,
                        isReply,
                        isQuote,
                        isSpace,
                        replyTo,
                        quotedTweet,
                        spaceInfo,
                        originalAuthor: creator,
                        timestamp: new Date(pubDate).getTime() / 1000,
                        media
                    });
                } catch (itemError) {
                    console.warn('Error processing tweet:', itemError);
                    continue;
                }
            }
            
            return tweets;
        } catch (error) {
            console.warn(`Proxy ${proxy} failed:`, error);
            continue;
        }
    }

    // If all proxies fail, throw an error
    throw new Error('All CORS proxies failed to fetch tweets');
}

// Helper function to format tweet text
function formatTweetText(text) {
    return text
        // Remove links to nitter
        .replace(/https?:\/\/nitter\.[^\s]+/g, '')
        // Convert newlines to HTML breaks
        .replace(/\n/g, '<br>')
        // Make hashtags blue and clickable
        .replace(/#(\w+)/g, '<span class="text-blue-500">#$1</span>')
        // Clean up extra spaces and line breaks
        .replace(/(<br>){3,}/g, '<br><br>')
        .trim();
}

// Add this to handle safe status checking
async function safeCheckLiveStatus() {
    try {
        await checkLiveStatus();
    } catch (error) {
        console.error('Failed to check live status:', error);
        document.getElementById('liveStatus').innerHTML = `
            <div class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-600">Error checking live status</p>
            </div>
        `;
        document.getElementById('timeCounter').textContent = 'Error loading time';
    }
}

// Add this initialization function
async function initializeApp() {
    console.log('Initializing app...');
    try {
        // Initialize the Holodex client first
        console.log('Initializing Holodex client...');
        holodexClient = await initializeHolodexClient();
        console.log('Holodex client initialized:', holodexClient);
        
        if (!holodexClient) {
            throw new Error('Failed to initialize Holodex client');
        }
        
        // Then start the live status checking
        console.log('Starting live status check...');
        await safeCheckLiveStatus();
        
        // Set up interval with rate limiting
        let updateInterval = setInterval(() => {
            const now = new Date();
            if (!lastUpdateTime || (now - lastUpdateTime) >= UPDATE_INTERVAL) {
                safeCheckLiveStatus();
            }
        }, 60000);

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (updateInterval) clearInterval(updateInterval);
            if (window.timeCounterInterval) clearInterval(window.timeCounterInterval);
        });
    } catch (error) {
        console.error('App initialization failed:', error);
        document.getElementById('liveStatus').innerHTML = `
            <div class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-600">Failed to initialize application: ${error.message}</p>
            </div>
        `;
    }
}

// Wait for DOM to be fully loaded, then initialize
document.addEventListener('DOMContentLoaded', initializeApp);

// Update the force refresh function
window.forceCacheRefresh = async () => {
    try {
        // Clear all cached data
        localStorage.removeItem('liveVideos');
        localStorage.removeItem('recentVideos');
        localStorage.removeItem('tweets');
        
        // Force an immediate check
        await safeCheckLiveStatus();
    } catch (error) {
        console.error('Force refresh failed:', error);
    }
};