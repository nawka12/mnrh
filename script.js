import { HolodexApiClient } from 'holodex.js';

// At the top of the file, after imports
console.log('Script loaded');

// Initialize both clients
let holodexClient = null;

// Add these constants near the top of the file, after other constants
const COLLABS_CACHE_KEY = 'collabVideos';
const CLIPS_CACHE_KEY = 'clipVideos';

// Add this constant for original songs cache
const ORIGINAL_SONGS_CACHE_KEY = 'originalSongs';

// Add this constant near the other cache keys
const COVER_SONGS_CACHE_KEY = 'coverSongs';

// Add this constant for career timeline
const CAREER_TIMELINE = [
    {
        date: "2020-03-03",
        event: "YouTube channel created"
    },
    {
        date: "2020-04-07",
        event: "First tweet on Twitter"
    },
    {
        date: "2020-04-11",
        event: "Official debut as hololive Indonesia 1st Generation member"
    },
    {
        date: "2020-06-04",
        event: "Released first cover song 'Again' by Beverly"
    },
    {
        date: "2020-08-16",
        event: "Debuted second 2D costume (Traditional Indonesian clothes)"
    },
    {
        date: "2021-01-06",
        event: "Reached 400,000 YouTube subscribers (First Indonesian hololive member)"
    },
    {
        date: "2021-02-16",
        event: "Released original song 'Ai no Chiisana Uta' and reached 500k subscribers"
    },
    {
        date: "2021-04-15",
        event: "Reached 600,000 YouTube subscribers"
    },
    {
        date: "2021-06-06",
        event: "Reached 700,000 YouTube subscribers"
    },
    {
        date: "2021-08-08",
        event: "Reached 800,000 YouTube subscribers"
    },
    {
        date: "2021-10-22",
        event: "Debuted third 2D model"
    },
    {
        date: "2021-10-30",
        event: "Reached 900,000 YouTube subscribers"
    },
    {
        date: "2022-02-15",
        event: "Released second original song 'High Tide'"
    },
    {
        date: "2022-02-22",
        event: "Reached 1 million YouTube subscribers"
    },
    {
        date: "2022-03-19",
        event: "3D model debut at hololive 3rd fes"
    },
    {
        date: "2022-04-15",
        event: "Released group song 'HI-15' with Risu and Iofi"
    },
    {
        date: "2022-05-06",
        event: "Twitter account verified (First hololive ID Gen 1 member)"
    },
    {
        date: "2022-09-16",
        event: "Official 3D model showcase and released 'Perisai Jitu'"
    },
    {
        date: "2022-10-27",
        event: "Debuted fourth 2D costume"
    },
    {
        date: "2022-11-04",
        event: "Added potato accessory to third 2D costume"
    },
    {
        date: "2022-11-25",
        event: "Released full MV of 'Perisai Jitu'"
    },
    {
        date: "2023-02-03",
        event: "Debuted fifth 2D costume (New Year Kimono)"
    },
    {
        date: "2023-03-19",
        event: "Debuted 3D idol costume at hololive 4th fes"
    },
    {
        date: "2023-04-01",
        event: "Debuted child version 2D model"
    },
    {
        date: "2023-04-11",
        event: "Released fourth original song 'Who's Toxic? It's You!'"
    },
    {
        date: "2023-07-01",
        event: "Debuted 3D yukata costume"
    },
    {
        date: "2023-08-27",
        event: "Debuted 3D swimsuit at hololive Summer 2023"
    },
    {
        date: "2024-01-06",
        event: "Released first EP 'ORBITURE' and new song 'Taut Hati'"
    },
    {
        date: "2024-01-13",
        event: "Revealed 3.0 update for main 2D model"
    },
    {
        date: "2024-04-11",
        event: "Debuted sixth 2D costume and released song 'DEJAVU'"
    },
    {
        date: "2024-06-03",
        event: "Added construction uniform accessories to third 2D costume"
    },
    {
        date: "2024-08-11",
        event: "Debuted 3D chibi model in holo no graffiti"
    },
    {
        date: "2024-08-17",
        event: "Debuted 3D school uniform and released 'Senandung Jiwa'"
    },
    {
        date: "2024-11-11",
        event: "Released seventh original song 'Multiverse'"
    },
    {
        date: "2024-12-09",
        event: "Released eighth original song 'Nightmare'"
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

// Add this helper function near the other helper functions (like formatDate and formatDateTime)
function getLatestTime(video) {
    // Try all possible date fields
    const dates = [
        video.published_at,
        video.available_at,
        video.start_scheduled,
        video.start_actual,
        // Also try nested fields
        video.raw?.published_at,
        video.raw?.available_at,
        video.raw?.start_scheduled,
        video.raw?.start_actual
    ].filter(Boolean); // Remove null/undefined values

    if (dates.length === 0) {
        debugWarn('No valid date found for video:', video.title);
        return new Date(0); // Return oldest possible date if no valid date found
    }

    // Convert all dates to Date objects
    const dateTimes = dates.map(d => new Date(d));
    
    // Return the most recent date
    return new Date(Math.max(...dateTimes.map(d => d.getTime())));
}

// Add this near the top with other constants
const VERBOSE = false;

// Add this debug logger function
const debugLog = (...args) => {
    if (VERBOSE) {
        console.log(...args);
    }
};

// Add this debug error logger function
const debugError = (...args) => {
    if (VERBOSE) {
        console.error(...args);
    } else if (args[0] instanceof Error) {
        // Always log actual Error objects even in non-verbose mode
        console.error(args[0]);
    }
};

// Add this debug warning logger function
const debugWarn = (...args) => {
    if (VERBOSE) {
        console.warn(...args);
    }
};

async function initializeHolodexClient() {
    debugLog('initializeHolodexClient called');
    // Always create a new client, regardless of existing one
    try {
        debugLog('Creating new Holodex client...');
        holodexClient = new HolodexApiClient({
            apiKey: 'aa758d74-e7ac-46ef-9d99-f7ebc8d033a1'
        });
        debugLog('Holodex client created successfully');
        return holodexClient;
    } catch (error) {
        debugError('Failed to initialize Holodex client:', error);
        return null;
    }
}

const MOONA_CHANNEL_ID = 'UCP0BspO_AMEe3aQqqpo89Dg';
const TWITTER_USERNAME = 'moonahoshinova';

let lastUpdateTime = null;
const UPDATE_INTERVAL = 1 * 60 * 1000; // 1 minutes in milliseconds

// Update the cache duration to be shorter
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds

// Update the cache object's get method to be more strict
const cache = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const { value, timestamp } = JSON.parse(item);
            
            // Add additional staleness checks
            if (!timestamp || 
                Date.now() - timestamp > CACHE_DURATION || 
                !pageVisible || 
                Date.now() - lastVisibilityChange > CACHE_DURATION) {
                debugLog(`Cache invalidated for ${key} due to staleness or visibility`);
                localStorage.removeItem(key);
                return null;
            }

            // Convert date strings back to Date objects for Holodex API responses
            if (Array.isArray(value)) {
                return value.map(item => {
                    // If it's a video object
                    if (item.videoId || item.raw?.id) {
                        // Get all possible date fields
                        const dates = {
                            published_at: item.raw?.published_at,
                            available_at: item.raw?.available_at,
                            start_scheduled: item.raw?.start_scheduled,
                            start_actual: item.raw?.start_actual
                        };

                        // Convert all date strings to Date objects
                        const convertedDates = Object.entries(dates).reduce((acc, [key, value]) => {
                            if (value) {
                                try {
                                    acc[key] = new Date(value);
                                    // Validate the date
                                    if (isNaN(acc[key].getTime())) {
                                        debugWarn(`Invalid date for ${key}:`, value);
                                        acc[key] = null;
                                    }
                                } catch (error) {
                                    debugWarn(`Error converting date for ${key}:`, error);
                                    acc[key] = null;
                                }
                            } else {
                                acc[key] = null;
                            }
                            return acc;
                        }, {});

                        // For upcoming streams, use start_scheduled as the main reference
                        if (item.status === 'upcoming' && convertedDates.start_scheduled) {
                            return {
                                ...item,
                                videoId: item.videoId || item.raw?.id,
                                title: item.title || item.raw?.title,
                                scheduledStart: convertedDates.start_scheduled,
                                status: 'upcoming',
                                raw: item.raw
                            };
                        }

                        // For regular videos, compare published_at and available_at
                        const publishedAt = convertedDates.published_at;
                        const availableAt = convertedDates.available_at;
                        
                        // Get the latest time between published_at and available_at
                        const latestTime = publishedAt && availableAt ? 
                            (availableAt > publishedAt ? availableAt : publishedAt) : 
                            (publishedAt || availableAt);

                        debugLog('Processing video:', {
                            videoId: item.videoId || item.raw?.id,
                            status: item.status,
                            dates: convertedDates,
                            latestTime
                        });

                        return {
                            ...item,
                            videoId: item.videoId || item.raw?.id,
                            title: item.title || item.raw?.title,
                            publishedAt: latestTime,
                            status: item.status || item.raw?.status,
                            raw: item.raw
                        };
                    }
                    return item;
                });
            }
            return value;
        } catch (error) {
            debugWarn('Cache read error:', error);
            localStorage.removeItem(key); // Clear potentially corrupted cache
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
            debugWarn('Cache write error:', error);
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
    ['liveVideos', 'recentVideos', 'tweets', COLLABS_CACHE_KEY, CLIPS_CACHE_KEY, ORIGINAL_SONGS_CACHE_KEY, COVER_SONGS_CACHE_KEY].forEach(key => {
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
            <span class="text-yellow-100">Last updated: ${latestFetchTime ? new Date(latestFetchTime).toLocaleTimeString() : 'Never'}</span>
            <span class="text-yellow-200 text-xs">
                (Live: ${cacheStatus.liveVideos} | 
                 Videos: ${cacheStatus.recentVideos} | 
                 Collabs: ${cacheStatus[COLLABS_CACHE_KEY]} |
                 Clips: ${cacheStatus[CLIPS_CACHE_KEY]} |
                 Songs: ${cacheStatus[ORIGINAL_SONGS_CACHE_KEY]} |
                 Covers: ${cacheStatus[COVER_SONGS_CACHE_KEY]} |
                 Tweets: ${cacheStatus.tweets})
            </span>
        </div>
    `;
}

async function checkLiveStatus() {
    // Show loading state
    document.getElementById('liveStatus').innerHTML = `
        <div class="bg-purple-600 border-2 border-red-500 rounded-lg p-6">
            <p class="text-red-400">Loading...</p>
        </div>
    `;
    
    try {
        const now = new Date();
        lastUpdateTime = now;

        async function getThumbnailUrl(videoId) {
            try {
                // Try maxresdefault first
                const maxRes = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
                const response = await fetch(maxRes, { method: 'HEAD' });
                if (response.ok) {
                    return maxRes;
                }
                // If maxresdefault fails, return hqdefault without checking
                return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            } catch (error) {
                // If any error occurs, return hqdefault
                return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            }
        }

        const getCachedOrFetch = async (key, fetchFn) => {
            try {
                debugLog(`Fetching ${key}...`);
                const cachedData = cache.get(key);
                
                if (cachedData) {
                    debugLog(`Found cached data for ${key}:`, {
                        sample: cachedData[0] ? {
                            videoId: cachedData[0].videoId,
                            title: cachedData[0].title,
                            scheduledStart: cachedData[0].scheduledStart,
                            publishedAt: cachedData[0].publishedAt,
                            raw: {
                                published_at: cachedData[0].raw?.published_at,
                                available_at: cachedData[0].raw?.available_at,
                                start_scheduled: cachedData[0].raw?.start_scheduled
                            }
                        } : 'No items'
                    });
                    return cachedData;
                }
                
                if (key.includes('Videos')) {
                    debugLog(`Initializing client for ${key}`);
                    holodexClient = await initializeHolodexClient();
                    if (!holodexClient) {
                        throw new Error('Holodex client not initialized');
                    }
                }
                
                debugLog(`Fetching fresh data for ${key}`);
                const rawData = await fetchFn();
                
                // Process the fresh data to ensure consistent date handling
                const freshData = rawData.map(item => {
                    if (item.status === 'upcoming' && item.raw?.start_scheduled) {
                        return {
                            ...item,
                            videoId: item.videoId || item.raw?.id,
                            title: item.title || item.raw?.title,
                            scheduledStart: new Date(item.raw.start_scheduled),
                            status: 'upcoming',
                            raw: item.raw
                        };
                    }
                    
                    const publishedAt = item.raw?.published_at ? new Date(item.raw.published_at) : null;
                    const availableAt = item.raw?.available_at ? new Date(item.raw.available_at) : null;
                    
                    const latestTime = publishedAt && availableAt ? 
                        (availableAt > publishedAt ? availableAt : publishedAt) : 
                        (publishedAt || availableAt);
                    
                    return {
                        ...item,
                        videoId: item.videoId || item.raw?.id,
                        title: item.title || item.raw?.title,
                        publishedAt: latestTime,
                        status: item.status || item.raw?.status,
                        raw: item.raw
                    };
                });

                debugLog(`Processed fresh data for ${key}:`, {
                    sample: freshData[0] ? {
                        videoId: freshData[0].videoId,
                        title: freshData[0].title,
                        scheduledStart: freshData[0].scheduledStart,
                        publishedAt: freshData[0].publishedAt,
                        raw: {
                            published_at: freshData[0].raw?.published_at,
                            available_at: freshData[0].raw?.available_at,
                            start_scheduled: freshData[0].raw?.start_scheduled
                        }
                    } : 'No items'
                });
                
                if (!freshData) {
                    throw new Error(`No data returned for ${key}`);
                }
                
                cache.set(key, freshData);
                return freshData;
            } catch (error) {
                debugError(`Error in getCachedOrFetch for ${key}:`, error);
                document.getElementById('liveStatus').innerHTML = `
                    <div class="bg-purple-600 border-2 border-red-500 rounded-lg p-6">
                        <p class="text-red-400">Error loading data: ${error.message}</p>
                        <button onclick="window.location.reload()" 
                                class="mt-4 bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-4 py-2 rounded">
                            Reload Page
                        </button>
                    </div>
                `;
                return [];
            }
        };

        const [liveVideos, recentVideos, collabVideos, clipVideos, originalSongs, coverSongs, tweets] = await Promise.all([
            getCachedOrFetch('liveVideos', async () => {
                const client = await initializeHolodexClient();
                const videos = await client.getLiveVideosByChannelId(MOONA_CHANNEL_ID);
                return videos.filter(video => video.status !== 'missing');
            }),
            getCachedOrFetch('recentVideos', async () => {
                const client = await initializeHolodexClient();
                const videos = await client.getVideosByChannelId(MOONA_CHANNEL_ID, 'videos', { limit: 15 });
                return videos.filter(video => video.status !== 'missing');
            }),
            getCachedOrFetch(COLLABS_CACHE_KEY, async () => {
                const client = await initializeHolodexClient();
                const videos = await client.getVideosByChannelId(MOONA_CHANNEL_ID, 'collabs', { limit: 5 });
                return videos.filter(video => video.status !== 'missing');
            }),
            getCachedOrFetch(CLIPS_CACHE_KEY, async () => {
                const client = await initializeHolodexClient();
                const videos = await client.getVideosByChannelId(MOONA_CHANNEL_ID, 'clips', { limit: 5 });
                return videos.filter(video => video.status !== 'missing');
            }),
            getCachedOrFetch(ORIGINAL_SONGS_CACHE_KEY, async () => {
                const client = await initializeHolodexClient();
                
                debugLog('Fetching original songs...');
                
                // Fetch original songs from Moona's channel
                const moonaOriginals = await client.getVideosByChannelId(MOONA_CHANNEL_ID, 'videos', { 
                    limit: 50,
                    topic: 'Original_Song'
                });

                // Fetch original songs where Moona is mentioned
                const mentionedOriginals = await client.getVideos({ 
                    mentioned_channel_id: MOONA_CHANNEL_ID,
                    topic: 'Original_Song',
                    limit: 25,
                    sort: 'available_at',
                    order: 'desc'
                });

                // Filter out missing videos and unwanted titles
                const filteredMoonaOriginals = moonaOriginals.filter(video => 
                    video.status !== 'missing' &&
                    video.videoId !== 'opaixR7ZpIE' &&
                    video.videoId !== 'Lbv8E-rzVW8' &&
                    video.videoId !== 'frcPP_RH6yI'
                );
                const filteredMentionedOriginals = mentionedOriginals.filter(video => 
                    video.status !== 'missing' &&
                    video.videoId !== 'opaixR7ZpIE' &&
                    video.videoId !== 'Lbv8E-rzVW8' &&
                    video.videoId !== 'frcPP_RH6yI'
                );

                // Combine all originals
                const allOriginals = [...filteredMoonaOriginals, ...filteredMentionedOriginals];

                // Group videos by similar titles
                const groupedVideos = allOriginals.reduce((groups, video) => {
                    // Clean the title for grouping
                    const cleanTitle = video.title
                        .replace(/[\[【].*?[\]】]/g, '') // Remove text in brackets
                        .replace(/(MV|Official|Music Video|Video|Music|Animated)/gi, '') // Remove common markers
                        .replace(/\(.*?(remastered|ver|version).*?\)/gi, '') // Remove remastered/version variations in parentheses
                        .replace(/（.*?(remastered|ver|version).*?）/gi, '') // Remove remastered/version variations in Japanese parentheses
                        .replace(/\(.*?\)/g, '') // Remove remaining text in parentheses
                        .replace(/（.*?）/g, '') // Remove remaining Japanese parentheses
                        .replace(/feat\.|ft\./gi, '') // Remove featuring markers
                        .replace(/moona\s+hoshinova\s*[-–]\s*/gi, '') // Remove "Moona Hoshinova -"
                        .replace(/\s*[-–]\s*moona\s+hoshinova/gi, '') // Remove "- Moona Hoshinova"
                        .replace(/moona\s+hoshinova/gi, '') // Remove just "Moona Hoshinova"
                        .replace(/\s*[-–]\s*/g, '') // Remove dashes with optional spaces
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .replace(/instrumental/gi, '') // Remove "instrumental"
                        .replace(/remastered(\s+ver(sion)?)?/gi, '') // Remove standalone remastered mentions
                        .replace(/^['"]/g, '') // Remove leading quotes
                        .replace(/['"]$/g, '') // Remove trailing quotes
                        .trim()
                        .toLowerCase();

                    debugLog(`Title cleaning: "${video.title}" -> "${cleanTitle}"`);

                    if (!groups[cleanTitle]) {
                        groups[cleanTitle] = [];
                    }
                    groups[cleanTitle].push(video);
                    return groups;
                }, {});

                // For each group, select the best version
                const dedupedVideos = Object.values(groupedVideos).map(group => {
                    // Sort versions by priority:
                    // 1. MV versions (with 】)
                    // 2. Original versions (with "Original Song" or similar markers)
                    // 3. Non-instrumental versions
                    // 4. Non-remastered versions
                    // 5. Most recent version
                    return group.sort((a, b) => {
                        // Prefer MV versions
                        const aMV = a.title.includes('】');
                        const bMV = b.title.includes('】');
                        if (aMV && !bMV) return -1;
                        if (!aMV && bMV) return 1;

                        // Then prefer versions with "Original Song" or similar markers
                        const aOriginal = a.title.match(/Original Song|Official|MV/i);
                        const bOriginal = b.title.match(/Original Song|Official|MV/i);
                        if (aOriginal && !bOriginal) return -1;
                        if (!aOriginal && bOriginal) return 1;

                        // Then prefer non-instrumental versions
                        const aInst = a.title.toLowerCase().includes('instrumental');
                        const bInst = b.title.toLowerCase().includes('instrumental');
                        if (!aInst && bInst) return -1;
                        if (aInst && !bInst) return 1;

                        // Then prefer non-remastered versions
                        const aRemaster = a.title.toLowerCase().match(/remastered|remaster\s+ver/);
                        const bRemaster = b.title.toLowerCase().match(/remastered|remaster\s+ver/);
                        if (!aRemaster && bRemaster) return -1;
                        if (aRemaster && !bRemaster) return 1;

                        // Finally, sort by date
                        const timeA = getLatestTime(a);
                        const timeB = getLatestTime(b);
                        return timeB - timeA;
                    })[0]; // Take the first (highest priority) version
                });

                // Sort the final list by date
                const sortedVideos = dedupedVideos.sort((a, b) => {
                    const timeA = getLatestTime(a);
                    const timeB = getLatestTime(b);
                    
                    debugLog(`Comparing originals:
                        A: ${a.title} (${timeA.toISOString()})
                        B: ${b.title} (${timeB.toISOString()})
                        Result: ${timeB - timeA}`
                    );
                    
                    return timeB - timeA;
                });

                debugLog('Final sorted originals:', sortedVideos.map(v => ({
                    title: v.title,
                    date: getLatestTime(v).toISOString(),
                    channel: v.channel?.name,
                    raw: {
                        published_at: v.published_at,
                        available_at: v.available_at,
                        start_scheduled: v.start_scheduled
                    }
                })));

                return sortedVideos;
            }),
            getCachedOrFetch(COVER_SONGS_CACHE_KEY, async () => {
                const client = await initializeHolodexClient();
                
                debugLog('Fetching cover songs...');
                
                // Fetch covers from Moona's channel
                const moonaCovers = await client.getVideos({ 
                    channel_id: MOONA_CHANNEL_ID,
                    topic: 'Music_Cover',
                    limit: 25,
                    sort: 'available_at',
                    order: 'desc'
                });

                // Fetch covers where Moona is mentioned
                const mentionedCovers = await client.getVideos({ 
                    mentioned_channel_id: MOONA_CHANNEL_ID,
                    topic: 'Music_Cover',
                    limit: 25,
                    sort: 'available_at',
                    order: 'desc'
                });

                // Filter out missing videos, unwanted titles, and the specific AREA15 video
                const filteredMoonaCovers = moonaCovers.filter(video => 
                    video.status !== 'missing' && 
                    !video.title.includes('Amaya Miyu') && 
                    !video.title.includes('Rora Meeza') &&
                    !video.title.includes('AREA15 Original Song Medley')  // Added this condition
                );
                const filteredMentionedCovers = mentionedCovers.filter(video => 
                    video.status !== 'missing' && 
                    !video.title.includes('Amaya Miyu') && 
                    !video.title.includes('Rora Meeza') &&
                    !video.title.includes('AREA15 Original Song Medley')  // Added this condition
                );

                // Combine all covers and sort them together
                const allCovers = [...filteredMoonaCovers, ...filteredMentionedCovers]
                    .sort((a, b) => {
                        const timeA = getLatestTime(a);
                        const timeB = getLatestTime(b);
                        
                        // Add debug logging for sorting
                        debugLog(`Comparing:
                            A: ${a.title} (${timeA.toISOString()})
                            B: ${b.title} (${timeB.toISOString()})
                            Result: ${timeB - timeA}`
                        );
                        
                        return timeB - timeA;
                    });

                debugLog('Final sorted covers:', allCovers.map(v => ({
                    title: v.title,
                    date: getLatestTime(v).toISOString(),
                    raw: {
                        published_at: v.published_at,
                        available_at: v.available_at,
                        start_scheduled: v.start_scheduled
                    }
                })));

                return allCovers;
            }),
            getCachedOrFetch('tweets', getTweets)
        ]);

        // Move updateCacheStatus() here, after data is fetched
        updateCacheStatus();

        // Filter out live and upcoming streams from recent videos
        const filteredRecentVideos = recentVideos
            .filter(video => 
                video.status !== 'live' && 
                video.status !== 'upcoming'
            )
            .slice(0, 5);

        // Get the latest activity time from videos, collabs, and tweets
        let latestActivity = null;

        // Check videos first
        if (filteredRecentVideos.length > 0) {
            const latestVideo = filteredRecentVideos[0];
            debugLog('Latest video data:', {
                title: latestVideo.title,
                publishedAt: latestVideo.publishedAt,
                raw: {
                    published_at: latestVideo.raw?.published_at,
                    available_at: latestVideo.raw?.available_at
                }
            });
            
            if (latestVideo.publishedAt) {
                latestActivity = new Date(latestVideo.publishedAt);
            }
        }

        // Check collabs and compare with current latest activity
        if (collabVideos.length > 0) {
            const latestCollab = collabVideos[0];
            debugLog('Latest collab data:', {
                title: latestCollab.title,
                publishedAt: latestCollab.publishedAt,
                raw: {
                    published_at: latestCollab.raw?.published_at,
                    available_at: latestCollab.raw?.available_at
                }
            });
            
            if (latestCollab.publishedAt) {
                const collabDate = new Date(latestCollab.publishedAt);
                if (!latestActivity || collabDate > latestActivity) {
                    latestActivity = collabDate;
                }
            }
        }

        // Check tweets and compare with current latest activity
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
                        width: 100%;
                        max-width: 100%;
                        margin: 0 auto;
                        box-sizing: border-box;
                    }
                    .scroll-container {
                        display: flex;
                        overflow-x: auto;
                        gap: 0.75rem;
                        padding: 0.75rem;
                        scroll-snap-type: x mandatory;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                    }
                    .scroll-container::-webkit-scrollbar {
                        height: 4px;
                    }
                    .scroll-container::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                    }
                    .scroll-container::-webkit-scrollbar-thumb {
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
                        .scroll-container {
                            flex-wrap: wrap;
                            justify-content: center;
                            gap: 1rem;
                            padding: 1rem;
                            overflow-x: visible;
                        }
                        .grid-item {
                            flex: 0 0 350px;
                            max-width: 350px;
                            padding: 1.5rem;
                        }
                    }
                    .stream-thumbnail {
                        width: 100%;
                        height: auto;
                        aspect-ratio: 16/9;
                        object-fit: cover;
                        background-color: rgba(0, 0, 0, 0.2);
                        border-radius: 0.75rem;
                        transition: transform 0.3s ease;
                    }
                    .thumbnail-container {
                        position: relative;
                        overflow: hidden;
                        border-radius: 0.75rem;
                        margin-bottom: 1rem;
                    }
                    .thumbnail-container:hover .stream-thumbnail {
                        transform: scale(1.05);
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
            `;

            // Live Streams Section
            if (liveStreams.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">🔴 Live Now</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                `;
                
                for (const stream of liveStreams) {
                    const videoId = stream.raw?.id;
                    const title = stream.raw?.title;
                    const actualStart = stream.actualStart || new Date(stream.raw?.start_actual);
                    const liveViewers = stream.raw?.live_viewers;

                    html += `
                        <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                            ${stream.status === 'live' ? '<span class="status-badge live-badge">LIVE</span>' : ''}
                            <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${title}</h3>
                            <div class="thumbnail-container">
                                <img class="stream-thumbnail"
                                     src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg"
                                     data-video-id="${videoId}"
                                     onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg';"
                                     alt="Video thumbnail">
                            </div>
                            <div class="space-y-2 mb-4">
                                <p class="text-sm md:text-base text-yellow-100 opacity-90">${actualStart ? formatDateTime(actualStart) : 'N/A'}</p>
                                <p class="text-sm md:text-base text-yellow-100">Viewers: ${liveViewers?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <a href="https://youtube.com/watch?v=${videoId}"
                               target="_blank"
                               class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                Watch Stream
                            </a>
                        </div>
                    `;
                }
                html += '</div>';
            }

            // Upcoming Streams Section
            if (upcomingStreams.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">⏰ Upcoming Streams</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                `;
                
                for (const stream of upcomingStreams) {
                    const videoId = stream.raw?.id;
                    const title = stream.raw?.title;
                    const scheduledStart = stream.scheduledStart || new Date(stream.raw?.scheduled_start);
                    
                    html += `
                        <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                            ${stream.status === 'upcoming' ? '<span class="status-badge live-badge">UPCOMING</span>' : ''}
                            <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${title}</h3>
                            <div class="thumbnail-container">
                                <img class="stream-thumbnail"
                                     src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg"
                                     data-video-id="${videoId}"
                                     onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg';"
                                     alt="Video thumbnail">
                            </div>
                            <div class="space-y-2 mb-4">
                                <p class="text-sm md:text-base text-yellow-100 opacity-90">Scheduled for: ${scheduledStart ? formatDateTime(scheduledStart) : 'N/A'}</p>
                            </div>
                            <a href="https://youtube.com/watch?v=${videoId}"
                               target="_blank"
                               class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                Set Reminder
                            </a>
                        </div>
                    `;
                }
                html += '</div>';
            }

            // Recent videos section
            if (filteredRecentVideos.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Recent Videos</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                `;
                for (const video of filteredRecentVideos) {
                    html += `
                        <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                            ${video.status === 'live' ? '<span class="status-badge live-badge">LIVE</span>' : ''}
                            <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${video.title}</h3>
                            <div class="thumbnail-container">
                                <img class="stream-thumbnail"
                                     src="https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg"
                                     data-video-id="${video.videoId}"
                                     onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg';"
                                     alt="Video thumbnail">
                            </div>
                            <div class="space-y-2 mb-4">
                                <p class="text-sm md:text-base text-yellow-100 opacity-90">Latest activity: ${video.publishedAt ? formatDateTime(video.publishedAt) : 'N/A'}</p>
                                <p class="text-xs text-yellow-200">
                                    Published: ${video.raw?.published_at ? formatDateTime(new Date(video.raw.published_at)) : 'N/A'}<br>
                                    Available at: ${video.raw?.available_at ? formatDateTime(new Date(video.raw.available_at)) : 'N/A'}
                                </p>
                            </div>
                            <a href="https://youtube.com/watch?v=${video.videoId}"
                               target="_blank"
                               class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
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
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Recent Tweets</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Nitter</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                `;
                for (const tweet of tweets) {
                    html += `
                        <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                            <div class="flex items-center mb-2">
                                ${tweet.isRetweet ? 
                                    `<span class="text-yellow-200 text-sm">🔄 Retweeted from @${tweet.retweetedFrom?.replace(/^@/, '') || 'unknown'}</span>` :
                                    tweet.isReply ?
                                    `<span class="text-yellow-200 text-sm">↩️ Replying to @${tweet.replyTo?.replace(/^@/, '') || 'unknown'}</span>` :
                                    tweet.isSpace ?
                                    `<span class="text-yellow-200 text-sm">🎙️ Twitter Space</span>` :
                                    tweet.isQuote ?
                                    `<span class="text-yellow-200 text-sm">💬 Quoted @${tweet.quotedFrom?.replace(/^@/, '') || TWITTER_USERNAME}</span>` :
                                    `<span class="text-yellow-200 text-sm">@${tweet.originalAuthor?.replace(/^@/, '') || TWITTER_USERNAME}</span>`
                                }
                            </div>
                            <p class="text-sm md:text-base text-yellow-100 mb-3">${formatTweetText(tweet.text)}</p>
                            
                            ${tweet.isQuote ? `
                                <div class="border border-yellow-500 rounded-lg p-3 mb-3 bg-purple-500">
                                    <p class="text-sm text-yellow-200 mb-1">${tweet.quotedFrom?.replace(/^@/, '') || TWITTER_USERNAME}</p>
                                    <a href="https://x.com/${tweet.quotedFrom?.replace(/^@/, '') || TWITTER_USERNAME}/status/${tweet.quotedTweet?.id || tweet.quotedTweetId || tweet.id}" 
                                       target="_blank" 
                                       class="text-sm text-yellow-300 hover:text-yellow-400">
                                        View quoted tweet
                                    </a>
                                </div>
                            ` : ''}

                            ${tweet.spaceInfo ? `
                                <div class="border border-yellow-500 rounded-lg p-3 mb-3 bg-purple-500">
                                    <p class="text-sm font-semibold text-yellow-300 mb-2">🎙️ Twitter Space</p>
                                    <a href="${tweet.spaceInfo.url}" 
                                       target="_blank" 
                                       class="inline-block bg-yellow-500 text-purple-900 px-4 py-2 text-sm rounded-lg hover:bg-yellow-600 transition-colors touch-feedback">
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
                                <p class="text-xs text-yellow-200">Posted: ${formatDateTime(new Date(tweet.timestamp * 1000))}</p>
                            </div>
                            <a href="https://x.com/${tweet.originalAuthor ? tweet.originalAuthor.replace('@', '') : TWITTER_USERNAME}/status/${tweet.id}" 
                               target="_blank" 
                               class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                View Tweet
                            </a>
                        </div>
                    `;
                }
                html += '</div>';
            }

            // Add collabs section before the music playlist section
            if (collabVideos.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Recent Collaborations</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                            ${collabVideos.map(video => `
                                <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                                    ${video.status === 'live' ? '<span class="status-badge live-badge">LIVE</span>' : ''}
                                    <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${video.title}</h3>
                                    <div class="thumbnail-container">
                                        <img class="stream-thumbnail"
                                             src="https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg"
                                             data-video-id="${video.videoId}"
                                             onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg';"
                                             alt="Video thumbnail">
                                    </div>
                                    <div class="space-y-2 mb-4">
                                        <p class="text-sm md:text-base text-yellow-100 opacity-90">Latest activity: ${video.publishedAt ? formatDateTime(video.publishedAt) : 'N/A'}</p>
                                        <p class="text-xs text-yellow-200">
                                            Published: ${video.raw?.published_at ? formatDateTime(new Date(video.raw.published_at)) : 'N/A'}<br>
                                            Available at: ${video.raw?.available_at ? formatDateTime(new Date(video.raw.available_at)) : 'N/A'}
                                        </p>
                                        ${video.raw?.channel?.name ? 
                                            `<p class="text-sm text-yellow-200">Channel: ${video.raw.channel.name}</p>` : 
                                            ''}
                                    </div>
                                    <a href="https://youtube.com/watch?v=${video.videoId}" 
                                       target="_blank" 
                                       class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                        Watch Collab
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Add clips section before the music playlist section (after collabs)
            if (clipVideos.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Recent Clips</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                            ${clipVideos.map(video => `
                                <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                                    ${video.status === 'live' ? '<span class="status-badge live-badge">LIVE</span>' : ''}
                                    <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${video.title}</h3>
                                    <div class="thumbnail-container">
                                        <img class="stream-thumbnail"
                                             src="https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg"
                                             data-video-id="${video.videoId}"
                                             onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg';"
                                             alt="Video thumbnail">
                                    </div>
                                    <div class="space-y-2 mb-4">
                                        <p class="text-sm md:text-base text-yellow-100 opacity-90">Latest activity: ${video.publishedAt ? formatDateTime(video.publishedAt) : 'N/A'}</p>
                                        <p class="text-xs text-yellow-200">
                                            Published: ${video.raw?.published_at ? formatDateTime(new Date(video.raw.published_at)) : 'N/A'}<br>
                                            Available at: ${video.raw?.available_at ? formatDateTime(new Date(video.raw.available_at)) : 'N/A'}
                                        </p>
                                        ${video.raw?.channel?.name ? 
                                            `<p class="text-sm text-yellow-200">Clipped by: ${video.raw.channel.name}</p>` : 
                                            ''}
                                    </div>
                                    <a href="https://youtube.com/watch?v=${video.videoId}" 
                                       target="_blank" 
                                       class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                        Watch Clip
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Add music playlist section
            if (originalSongs.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Original Songs</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                            ${originalSongs.map(song => `
                                <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                                    <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${song.title}</h3>
                                    <div class="thumbnail-container">
                                        <img class="stream-thumbnail"
                                             src="https://i.ytimg.com/vi/${song.videoId || song.id}/hqdefault.jpg"
                                             data-video-id="${song.videoId || song.id}"
                                             onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${song.videoId || song.id}/hqdefault.jpg';"
                                             alt="Song thumbnail">
                                    </div>
                                    <div class="space-y-2 mb-4">
                                        <p class="text-sm md:text-base text-yellow-100 opacity-90">
                                            Published: ${song.publishedAt ? formatDateTime(song.publishedAt) : 'N/A'}
                                        </p>
                                        ${song.channel?.name ? 
                                            `<p class="text-sm text-yellow-200">Channel: ${song.channel.name}</p>` : 
                                            ''}
                                    </div>
                                    <a href="https://youtube.com/watch?v=${song.videoId || song.id}" 
                                       target="_blank" 
                                       class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                        Listen Now
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Add cover songs section
            if (coverSongs.length > 0) {
                html += `
                    <div class="flex flex-col items-center mb-8">
                        <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Cover Songs</h2>
                        <span class="text-xs text-yellow-200 italic opacity-75">Powered by Holodex</span>
                    </div>
                `;
                html += `
                    <div class="grid-container mb-12">
                        <div class="scroll-container">
                            ${coverSongs.map(song => `
                                <div class="card glass-effect rounded-2xl p-4 md:p-6 relative">
                                    <h3 class="text-lg md:text-xl font-semibold text-yellow-200 mb-4">${song.title}</h3>
                                    <div class="thumbnail-container">
                                        <img class="stream-thumbnail"
                                             src="https://i.ytimg.com/vi/${song.videoId || song.id}/hqdefault.jpg"
                                             data-video-id="${song.videoId || song.id}"
                                             onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${song.videoId || song.id}/hqdefault.jpg';"
                                             alt="Song thumbnail">
                                    </div>
                                    <div class="space-y-2 mb-4">
                                        <p class="text-sm md:text-base text-yellow-100 opacity-90">
                                            Published: ${song.publishedAt ? formatDateTime(song.publishedAt) : 'N/A'}
                                        </p>
                                        ${song.channel?.name ? 
                                            `<p class="text-sm text-yellow-200">Channel: ${song.channel.name}</p>` : 
                                            ''}
                                    </div>
                                    <a href="https://youtube.com/watch?v=${song.videoId || song.id}" 
                                       target="_blank" 
                                       class="inline-block w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-6 py-3 rounded-xl text-center transition-colors duration-200">
                                        Listen Now
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Add timeline section
            html += `
                <div class="flex flex-col items-center mb-8">
                    <h2 class="section-title text-2xl md:text-3xl font-bold text-yellow-300">Career Timeline</h2>
                    <span class="text-xs text-yellow-200 italic opacity-75">Major Milestones</span>
                </div>
                <div class="grid-container mb-12">
                    <div class="relative px-4 py-8 max-w-4xl mx-auto">
                        <div class="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-yellow-500/30"></div>
                        ${CAREER_TIMELINE.map((event, index) => `
                            <div class="relative mb-8">
                                <div class="flex items-center">
                                    <div class="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full"></div>
                                    <div class="w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 ml-auto'}">
                                        <div class="card glass-effect rounded-xl p-4">
                                            <div class="text-yellow-300 font-semibold mb-1">${formatDate(event.date)}</div>
                                            <div class="text-yellow-100">${event.event}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
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
            <div class="bg-purple-600 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-400">Error checking live status: ${error.message}</p>
                <button onclick="window.location.reload()" 
                        class="mt-4 bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-4 py-2 rounded">
                    Reload Page
                </button>
            </div>
        `;
        document.getElementById('timeCounter').textContent = 'Error loading time';
    }
}

async function scrapeNitterTweets() {
    debugLog('Scraping tweets from Nitter frontend...');
    
    const NITTER_BASE = 'https://nitter.privacydev.net';
    const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];

    // Helper function to parse the date string and convert from UTC to local time
    function parseTwitterDate(dateStr) {
        try {
            // Remove UTC and dot from the string
            const cleanDateStr = dateStr.replace(' UTC', '').replace(' · ', ' ');
            
            // Parse the UTC date
            const utcDate = new Date(cleanDateStr + ' UTC');
            
            // Convert to local timestamp
            const localTimestamp = utcDate.getTime();
            
            // Create new date object in local timezone
            const localDate = new Date(localTimestamp);
            
            debugLog('Date conversion:', {
                original: dateStr,
                cleaned: cleanDateStr,
                utc: utcDate.toISOString(),
                local: localDate.toLocaleString()
            });
            
            return localDate;
        } catch (error) {
            debugWarn('Error parsing date:', dateStr, error);
            return null;
        }
    }

    // Helper function to scrape tweets from a specific URL
    async function scrapeTweetsFromUrl(url, proxy) {
        const response = await fetch(`${proxy}${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        debugLog(`Got HTML response length for ${url}:`, html.length);
        
        // Create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find all timeline items within the timeline container
        const timelineItems = doc.querySelectorAll('.timeline .timeline-item');
        debugLog(`Found timeline items for ${url}:`, timelineItems.length);
        
        const tweets = [];
        
        for (const item of timelineItems) {
            try {
                // Skip pinned tweets
                const isPinned = item.querySelector('.pinned');
                if (isPinned) {
                    debugLog('Skipping pinned tweet');
                    continue;
                }

                // Check for reply
                const replyHeader = item.querySelector('.replying-to');
                const isReply = !!replyHeader;
                let replyTo = '';
                if (isReply) {
                    const replyUsername = replyHeader.querySelector('a')?.textContent?.trim();
                    if (replyUsername) {
                        replyTo = replyUsername;
                        debugLog('Found reply to:', replyTo);
                    }
                }

                // Check for retweet
                const retweetHeader = item.querySelector('.retweet-header');
                const isRetweet = !!retweetHeader;
                let retweetedFrom = '';
                if (isRetweet) {
                    // Get the original tweet's author
                    const originalAuthor = item.querySelector('.fullname')?.textContent?.trim();
                    const originalUsername = item.querySelector('.username')?.textContent?.trim();
                    if (originalUsername) {
                        retweetedFrom = originalUsername;
                        debugLog('Found retweet:', { 
                            author: originalAuthor,
                            username: originalUsername 
                        });
                    }
                }

                // Check for quote tweet
                const quoteTweet = item.querySelector('.quote');
                const isQuote = !!quoteTweet;
                let quotedFrom = '';
                let quotedTweetId = '';
                if (isQuote) {
                    const quoteUsername = quoteTweet.querySelector('.username')?.textContent.trim();
                    const quoteLink = quoteTweet.querySelector('a.quote-link')?.getAttribute('href');
                    if (quoteUsername) {
                        quotedFrom = quoteUsername;
                        quotedTweetId = quoteLink ? quoteLink.split('/status/')[1]?.split('#')[0] : '';
                        debugLog('Found quote tweet:', { from: quotedFrom, id: quotedTweetId });
                    }
                }

                // Get tweet content
                const contentElement = item.querySelector('.tweet-content');
                if (!contentElement) {
                    debugLog('No content element found');
                    continue;
                }
                let content = contentElement.textContent.trim();

                // Get tweet ID from the link
                const tweetLink = item.querySelector('a.tweet-link');
                const tweetId = tweetLink ? tweetLink.getAttribute('href').split('/status/')[1]?.split('#')[0] : null;
                if (!tweetId) {
                    debugLog('No tweet ID found');
                    continue;
                }

                // Get timestamp from tweet-date
                const dateElement = item.querySelector('.tweet-date a');
                const dateText = dateElement?.getAttribute('title'); // This contains the full date format
                if (!dateText) {
                    debugLog('No date found');
                    continue;
                }

                // Parse the date
                const date = parseTwitterDate(dateText);
                if (!date) {
                    debugLog('Invalid date:', dateText);
                    continue;
                }

                // Get tweet stats
                const stats = {
                    replies: parseInt(item.querySelector('.icon-comment')?.closest('.tweet-stat')?.textContent?.trim() || '0'),
                    retweets: parseInt(item.querySelector('.icon-retweet')?.closest('.tweet-stat')?.textContent?.trim() || '0'),
                    likes: parseInt(item.querySelector('.icon-heart')?.closest('.tweet-stat')?.textContent?.trim() || '0')
                };

                // Get media attachments
                const media = [];
                
                // Check for images
                const images = item.querySelectorAll('.attachments .attachment.image img, .gallery-row img');
                images.forEach(img => {
                    let url = img.getAttribute('src');
                    if (url && url.startsWith('/')) {
                        url = NITTER_BASE + url;
                    }
                    if (url) {
                        media.push({
                            type: 'image',
                            url: url
                        });
                    }
                });

                // Check for videos
                const videos = item.querySelectorAll('.attachments .gallery-video video source, .gallery-video video source');
                videos.forEach(source => {
                    let url = source.getAttribute('src');
                    if (url && url.startsWith('/')) {
                        url = NITTER_BASE + url;
                    }
                    if (url) {
                        media.push({
                            type: 'video',
                            url: url
                        });
                    }
                });

                tweets.push({
                    id: tweetId,
                    text: content,
                    timestamp: Math.floor(date.getTime() / 1000),
                    stats,
                    media,
                    isReply,
                    isRetweet,
                    isQuote,
                    replyTo,
                    retweetedFrom,
                    quotedFrom,
                    quotedTweetId
                });

            } catch (error) {
                debugWarn('Error parsing tweet:', error);
            }
        }

        return tweets;
    }

    for (const proxy of corsProxies) {
        try {
            // Try to fetch both main timeline and replies timeline
            const [mainTweets, replyTweets] = await Promise.all([
                scrapeTweetsFromUrl(`${NITTER_BASE}/${TWITTER_USERNAME}`, proxy),
                scrapeTweetsFromUrl(`${NITTER_BASE}/${TWITTER_USERNAME}/with_replies`, proxy)
            ]);

            debugLog(`Scraped ${mainTweets.length} main tweets and ${replyTweets.length} reply tweets using proxy ${proxy}`);

            // Combine tweets, prioritizing main timeline tweets
            const seenIds = new Set();
            const combinedTweets = [];

            // Add main timeline tweets first
            for (const tweet of mainTweets) {
                if (!seenIds.has(tweet.id)) {
                    seenIds.add(tweet.id);
                    combinedTweets.push({
                        ...tweet,
                        fromMainTimeline: true
                    });
                }
            }

            // Add reply tweets that weren't in the main timeline
            for (const tweet of replyTweets) {
                if (!seenIds.has(tweet.id)) {
                    seenIds.add(tweet.id);
                    combinedTweets.push({
                        ...tweet,
                        fromMainTimeline: false
                    });
                }
            }

            // Sort by timestamp
            combinedTweets.sort((a, b) => b.timestamp - a.timestamp);

            return combinedTweets;

        } catch (error) {
            debugWarn(`Proxy ${proxy} failed:`, error);
            continue;
        }
    }

    // If all proxies fail, return empty array
    debugError('All proxies failed to scrape Nitter frontend');
    return [];
}

// Update the getTweets function to use both RSS and scraped sources
async function getTweets() {
    try {
        // Try to get tweets from both sources
        const [scrapedTweets, rssTweets] = await Promise.all([
            scrapeNitterTweets(),
            getRSSTweets().catch(error => {
                debugWarn('RSS fetch failed:', error);
                return [];
            })
        ]);
        
        debugLog(`Got ${scrapedTweets.length} scraped tweets and ${rssTweets.length} RSS tweets`);

        // Combine tweets from both sources
        const allTweets = [...scrapedTweets, ...rssTweets];

        // Use a Set to track unique tweet IDs
        const seenIds = new Set();
        const uniqueTweets = [];

        // Keep only unique tweets, preferring scraped versions
        for (const tweet of allTweets) {
            if (!seenIds.has(tweet.id)) {
                seenIds.add(tweet.id);
                uniqueTweets.push(tweet);
            }
        }

        // Sort by timestamp and take the most recent 5
        const sortedTweets = uniqueTweets
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        debugLog('Final combined tweets for testing:', sortedTweets.map(t => ({
            id: t.id,
            timestamp: t.timestamp,
            text: t.text.substring(0, 50) + '...',
            isReply: t.isReply,
            replyTo: t.replyTo,
            isRetweet: t.isRetweet,
            isQuote: t.isQuote,
            quotedFrom: t.quotedFrom, // Use quotedFrom instead of quotedTweet.author
            media: t.media?.length || 0,
            source: t.source
        })));

        return sortedTweets;

    } catch (error) {
        debugError('Error getting tweets:', error);
        return [];
    }
}

// Add new helper function to get RSS tweets
async function getRSSTweets() {
    const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];

    for (const proxy of corsProxies) {
        try {
            // Fetch both RSS feeds
            const [mainResponse, repliesResponse] = await Promise.all([
                fetch(proxy + encodeURIComponent(`https://nitter.privacydev.net/${TWITTER_USERNAME}/rss`)),
                fetch(proxy + encodeURIComponent(`https://nitter.privacydev.net/${TWITTER_USERNAME}/with_replies/rss`))
            ]);

            if (!mainResponse.ok || !repliesResponse.ok) {
                console.warn(`Proxy ${proxy} failed with status: ${mainResponse.status}/${repliesResponse.status}`);
                continue;
            }

            // Parse both feeds
            const parser = new DOMParser();
            const [mainXml, repliesXml] = await Promise.all([
                parser.parseFromString(await mainResponse.text(), "text/xml"),
                parser.parseFromString(await repliesResponse.text(), "text/xml")
            ]);

            // Verify both XMLs are valid
            if (mainXml.getElementsByTagName('parsererror').length > 0 || 
                repliesXml.getElementsByTagName('parsererror').length > 0) {
                console.warn(`Proxy ${proxy} returned invalid XML`);
                continue;
            }

            // Process tweets as before
            const mainItems = Array.from(mainXml.querySelectorAll('item'));
            const repliesItems = Array.from(repliesXml.querySelectorAll('item'));
            const allItems = [...mainItems, ...repliesItems];

            // Use a Set to track unique tweet IDs
            const seenIds = new Set();
            const tweets = [];

            // Add debug logging for feed contents
            debugLog(`Main feed items: ${mainItems.length}`);
            debugLog(`Replies feed items: ${repliesItems.length}`);
            debugLog(`Combined items: ${allItems.length}`);

            for (const item of allItems) {
                try {
                    const link = item.querySelector('link')?.textContent || '';
                    const id = link.split('/status/')[1]?.split('#')[0];
                    
                    // Add debug logging for each item
                    debugLog(`Processing tweet: ${link} (ID: ${id})`);
                    
                    // Skip if we've already processed this tweet
                    if (!id || seenIds.has(id)) {
                        debugLog(`Skipping duplicate or invalid tweet: ${id}`);
                        continue;
                    }
                    seenIds.add(id);

                    // Rest of your existing tweet processing code
                    const title = item.querySelector('title')?.textContent || '';
                    const creator = item.querySelector('creator')?.textContent || `@${TWITTER_USERNAME}`;
                    const description = item.querySelector('description')?.textContent || '';
                    const pubDate = item.querySelector('pubDate')?.textContent;
                    
                    if (!link || !pubDate) continue;
                    
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
                                // Extract the quoted tweet ID from the link
                                const quotedId = quoteLink.split('/status/')[1]?.split(/[#\?]/)[0];  // Split on # or ?
                                const quotedAuthor = quoteLink.split('/')[3];
                                quotedTweet = {
                                    id: quotedId,
                                    author: quotedAuthor
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
                                
                                // Extract video filename from Nitter URL
                                const videoMatch = originalUrl.match(/video\.twimg\.com%2Ftweet_video%2F([^.]+\.mp4)/);
                                if (videoMatch) {
                                    const videoUrl = `https://video.twimg.com/tweet_video/${videoMatch[1]}`;
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

            // After the loop, sort and slice
            return tweets
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5); // Take the 15 most recent tweets

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
        // Make hashtags yellow and clickable
        .replace(/#(\w+)/g, '<span class="text-yellow-300">#$1</span>')
        // Clean up extra spaces and line breaks
        .replace(/(<br>){3,}/g, '<br><br>')
        .trim();
}

// Add these variables near the top with other constants
let pageVisible = true;
let lastVisibilityChange = Date.now();

// Add this function near the top with other initialization functions
function handleVisibilityChange() {
    if (document.hidden) {
        pageVisible = false;
    } else {
        pageVisible = true;
        lastVisibilityChange = Date.now();
        // Force an immediate refresh when page becomes visible
        console.log('Page became visible, forcing refresh...');
        window.forceCacheRefresh();
    }
}

// Update the safeCheckLiveStatus function
async function safeCheckLiveStatus() {
    try {
        // Only proceed if page is visible
        if (!pageVisible) {
            debugLog('Page is not visible, skipping status check');
            return;
        }

        // Check if we've been hidden for too long
        const timeSinceVisibilityChange = Date.now() - lastVisibilityChange;
        if (timeSinceVisibilityChange > UPDATE_INTERVAL) {
            debugLog('Long period of inactivity detected, forcing cache refresh...');
            await window.forceCacheRefresh();
            return;
        }

        // Reset Holodex client on each check to ensure fresh connection
        holodexClient = await initializeHolodexClient();
        
        await checkLiveStatus();
        
        // Update last check time after successful update
        lastUpdateTime = new Date();
    } catch (error) {
        debugError('Failed to check live status:', error);
        document.getElementById('liveStatus').innerHTML = `
            <div class="bg-purple-600 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-400">Error checking live status: ${error.message}</p>
                <button onclick="window.location.reload()" 
                        class="mt-4 bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-4 py-2 rounded">
                    Reload Page
                </button>
            </div>
        `;
        document.getElementById('timeCounter').textContent = 'Error loading time';
    }
}

// Add these constants near the top
const PULL_THRESHOLD = 80; // pixels
let touchStartY = 0;
let pullDistance = 0;
let isPulling = false;
let refreshIndicator = null;

// Add this function near other initialization code
function initializePullToRefresh() {
    // Create refresh indicator element with improved styling
    refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'fixed left-0 right-0 flex items-center justify-center -translate-y-full transition-all duration-200 ease-out z-50 opacity-0';
    refreshIndicator.innerHTML = `
        <div class="bg-yellow-500 text-purple-900 p-3 rounded-full shadow-lg transform transition-all duration-200 ease-out">
            <span class="pull-text">
                <svg class="w-6 h-6 transform rotate-0 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </span>
            <span class="refreshing-text hidden">
                <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </span>
        </div>
    `;
    document.body.appendChild(refreshIndicator);

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Add these touch event handlers
function handleTouchStart(e) {
    // Only enable pull to refresh when at top of page
    if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        isPulling = true;
    }
}

function handleTouchMove(e) {
    if (!isPulling) return;

    pullDistance = Math.max(0, e.touches[0].clientY - touchStartY);
    
    // Prevent default scrolling while pulling
    if (pullDistance > 0) {
        e.preventDefault();
    }

    // Add resistance to the pull (square root function for natural feel)
    const resistedPull = Math.sqrt(pullDistance) * 8;
    
    // Only show indicator when pulling down
    if (pullDistance > 0) {
        refreshIndicator.style.opacity = '1';
        refreshIndicator.style.transform = `translateY(${Math.min(resistedPull, PULL_THRESHOLD * 1.2)}px)`;
        
        // Rotate arrow based on pull progress
        const arrow = refreshIndicator.querySelector('.pull-text svg');
        const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
        arrow.style.transform = `rotate(${180 * progress}deg)`;
    } else {
        refreshIndicator.style.opacity = '0';
        refreshIndicator.style.transform = 'translateY(-100%)';
    }
}

function handleTouchEnd() {
    if (!isPulling) return;
    isPulling = false;

    if (pullDistance >= PULL_THRESHOLD) {
        // Show refreshing state with smooth transition
        const pullText = refreshIndicator.querySelector('.pull-text');
        const refreshingText = refreshIndicator.querySelector('.refreshing-text');
        
        pullText.classList.add('hidden');
        refreshingText.classList.remove('hidden');

        // Keep indicator visible during refresh
        refreshIndicator.style.opacity = '1';
        refreshIndicator.style.transform = `translateY(${PULL_THRESHOLD * 0.5}px)`;

        // Trigger refresh
        window.forceCacheRefresh().finally(() => {
            // Smooth reset after refresh
            refreshIndicator.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            refreshIndicator.style.transform = 'translateY(-100%)';
            refreshIndicator.style.opacity = '0';
            
            setTimeout(() => {
                refreshingText.classList.add('hidden');
                pullText.classList.remove('hidden');
                refreshIndicator.style.transition = ''; // Reset transition
            }, 300);
        });
    } else {
        // Smooth reset without refreshing
        refreshIndicator.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        refreshIndicator.style.transform = 'translateY(-100%)';
        refreshIndicator.style.opacity = '0';
        setTimeout(() => {
            refreshIndicator.style.transition = ''; // Reset transition
        }, 300);
    }

    pullDistance = 0;
}

// Update the initializeApp function to include pull-to-refresh
async function initializeApp() {
    debugLog('Initializing app...');
    try {
        // Initialize pull-to-refresh
        initializePullToRefresh();
        
        // Add visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Initialize the Holodex client first
        debugLog('Initializing Holodex client...');
        holodexClient = await initializeHolodexClient();
        debugLog('Holodex client initialized:', holodexClient);
        
        if (!holodexClient) {
            throw new Error('Failed to initialize Holodex client');
        }
        
        // Initial status check
        debugLog('Starting initial live status check...');
        await safeCheckLiveStatus();
        
        // Set up interval for auto-refresh
        const autoRefreshInterval = setInterval(async () => {
            const now = new Date();
            if (!lastUpdateTime || (now - lastUpdateTime) >= UPDATE_INTERVAL) {
                debugLog('Running auto-refresh...');
                await safeCheckLiveStatus();
            }
        }, 60000); // Check every minute

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            if (window.timeCounterInterval) clearInterval(window.timeCounterInterval);
        });
    } catch (error) {
        debugError('App initialization failed:', error);
        document.getElementById('liveStatus').innerHTML = `
            <div class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-600">Failed to initialize application: ${error.message}</p>
            </div>
        `;
    }
}

// Update the force refresh function
window.forceCacheRefresh = async () => {
    try {
        debugLog('Starting aggressive cache clear...');
        
        // Clear all localStorage
        localStorage.clear();
        
        // Reset all state variables
        lastUpdateTime = null;
        lastVisibilityChange = Date.now();
        
        // Reset the Holodex client
        holodexClient = null;
        
        // Clear any existing intervals
        if (window.timeCounterInterval) {
            clearInterval(window.timeCounterInterval);
            window.timeCounterInterval = null;
        }
        
        debugLog('Reinitializing Holodex client...');
        holodexClient = await initializeHolodexClient();
        
        if (!holodexClient) {
            throw new Error('Failed to reinitialize Holodex client');
        }
        
        debugLog('Starting fresh status check...');
        await checkLiveStatus();
        
        // Update the cache status display
        updateCacheStatus();
        
        debugLog('Force refresh completed successfully');
    } catch (error) {
        debugError('Force refresh failed:', error);
        // Show error to user
        document.getElementById('liveStatus').innerHTML = `
            <div class="bg-purple-600 border-2 border-red-500 rounded-lg p-6">
                <p class="text-red-400">Error refreshing data: ${error.message}</p>
                <button onclick="window.location.reload()" 
                        class="mt-4 bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-semibold px-4 py-2 rounded">
                    Reload Page
                </button>
            </div>
        `;
    }
};

// Add at the beginning of the file
let bgMusic;
let isMuted = false;

// Initialize audio handling
function initializeAudio() {
    bgMusic = document.getElementById('bgMusic');
    const muteButton = document.getElementById('muteButton');
    const soundWaves = document.getElementById('soundWaves');
    
    // Ensure audio starts unmuted
    bgMusic.muted = false;
    
    // Try to play audio on page load
    document.addEventListener('click', function initAudio() {
        bgMusic.volume = 0.25; // Set a comfortable volume level
        bgMusic.muted = false; // Explicitly unmute
        bgMusic.play().catch(error => console.log("Audio autoplay failed:", error));
        document.removeEventListener('click', initAudio);
    }, { once: true });

    // Handle mute button clicks
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        bgMusic.muted = isMuted;
        soundWaves.style.display = isMuted ? 'none' : 'block';
    });
}

// Add this after the initializeAudio function
function initializeCreditsPopup() {
    const infoButton = document.getElementById('infoButton');
    const creditsPopup = document.getElementById('creditsPopup');
    const closeCredits = document.getElementById('closeCredits');

    // Show popup
    infoButton.addEventListener('click', () => {
        creditsPopup.classList.remove('hidden');
        // Add animation classes
        creditsPopup.classList.add('animate-fadeIn');
        creditsPopup.querySelector('.glass-effect').classList.add('animate-slideIn');
    });

    // Hide popup
    function hidePopup() {
        creditsPopup.classList.add('hidden');
        creditsPopup.classList.remove('animate-fadeIn');
        creditsPopup.querySelector('.glass-effect').classList.remove('animate-slideIn');
    }

    closeCredits.addEventListener('click', hidePopup);
    
    // Close when clicking outside
    creditsPopup.addEventListener('click', (e) => {
        if (e.target === creditsPopup) {
            hidePopup();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !creditsPopup.classList.contains('hidden')) {
            hidePopup();
        }
    });
}

// Wait for DOM to be fully loaded, then initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeAudio();
    initializeApp();  // Your existing initialization function
    initializeCreditsPopup();
});
