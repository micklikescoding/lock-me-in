import { logInfo, logError, startTimer, endTimer } from './logger';
import { 
  artistSearchCache, 
  artistSongsCache, 
  songDetailsCache, 
  producerDetailsCache 
} from './cache';

const GENIUS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
const GENIUS_API_BASE = 'https://api.genius.com';

// API request constants
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY = 5000; // 5 seconds
const BASE_DELAY = 1000; // 1 second

export interface Artist {
  id: number;
  name: string;
  image_url?: string;
  instagram_name?: string;
  twitter_name?: string;
  url?: string;
  description?: {
    plain?: string;
  };
}

export interface Producer {
  id: number;
  name: string;
  image_url?: string;
  instagram_name?: string;
  twitter_name?: string;
  genius_url?: string;
  bio?: string;
  notable_songs: Array<{
    title: string;
    artist: string;
    release_date?: string;
  }>;
}

export interface Song {
  id: number;
  title: string;
  producer_artists?: Artist[];
  custom_performances?: Array<{
    label: string;
    artists: Artist[];
  }>;
  primary_artist: Artist;
  release_date?: string;
}

// Helper function for pausing execution
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromGenius(endpoint: string, retryCount = 0): Promise<Record<string, unknown>> {
  try {
    const timerLabel = `API:${endpoint.split('?')[0]}`;
    startTimer(timerLabel);
    
    logInfo(`Making Genius API request to: ${endpoint} (attempt ${retryCount + 1})`);
    
    const response = await fetch(`${GENIUS_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Check if it's a rate limit error (429)
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        logInfo(`Rate limit hit, waiting ${RATE_LIMIT_DELAY}ms before retry...`);
        await delay(RATE_LIMIT_DELAY);
        return fetchFromGenius(endpoint, retryCount + 1);
      }

      // Check if it's a server error (5xx)
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        const backoffDelay = BASE_DELAY * Math.pow(2, retryCount);
        logInfo(`Server error, waiting ${backoffDelay}ms before retry...`);
        await delay(backoffDelay);
        return fetchFromGenius(endpoint, retryCount + 1);
      }

      // If we get here, it's an error we can't recover from
      const errorMessage = data.error || data.meta?.message || 'Unknown API Error';
      logError(`Genius API Error: ${errorMessage}`, {
        status: response.status,
        endpoint,
        retryCount
      });
      throw new Error(`Genius API Error: ${errorMessage}`);
    }

    endTimer(timerLabel);
    return data;
  } catch (error) {
    // Handle network errors or other unexpected issues
    if (error instanceof Error && retryCount < MAX_RETRIES) {
      const backoffDelay = BASE_DELAY * Math.pow(2, retryCount);
      logInfo(`Network error, waiting ${backoffDelay}ms before retry...`, { error: error.message });
      await delay(backoffDelay);
      return fetchFromGenius(endpoint, retryCount + 1);
    }
    
    // If we've exhausted retries or it's not a network error, rethrow
    throw error;
  }
}

/**
 * Search for an artist by name
 */
export async function searchArtist(name: string): Promise<Artist[]> {
  startTimer(`searchArtist:${name}`);
  
  // Check cache first
  const cacheKey = name.toLowerCase();
  const cachedResult = artistSearchCache.get(cacheKey);
  if (cachedResult) {
    endTimer(`searchArtist:${name}`);
    return cachedResult;
  }
  
  try {
    const data = await fetchFromGenius(`/search?q=${encodeURIComponent(name)}`);
    
    // Extract artists from search results
    const artists: Artist[] = data.response.hits
      .filter((hit: Record<string, unknown>) => hit.type === 'song')
      .map((hit: Record<string, unknown>) => hit.result.primary_artist)
      // Remove duplicates based on artist ID
      .filter((artist: Artist, index: number, self: Artist[]) => 
        index === self.findIndex((a) => a.id === artist.id)
      );
    
    // Cache the result
    artistSearchCache.set(cacheKey, artists);
    
    endTimer(`searchArtist:${name}`);
    return artists;
  } catch (error) {
    logError(`Error searching for artist: ${name}`, error);
    endTimer(`searchArtist:${name}`);
    throw error;
  }
}

/**
 * Get songs for an artist (single page)
 */
export async function getArtistSongs(artistId: number, page = 1): Promise<Song[]> {
  try {
    const data = await fetchFromGenius(`/artists/${artistId}/songs?page=${page}&per_page=50&sort=popularity`);
    return data.response.songs;
  } catch (error) {
    logError(`Error getting songs for artist ID ${artistId}, page ${page}`, error);
    throw error;
  }
}

/**
 * Get all songs for an artist (paginated)
 */
export async function getAllArtistSongs(artistId: number): Promise<Song[]> {
  startTimer(`getAllArtistSongs:${artistId}`);
  
  // Check cache first
  const cacheKey = artistId.toString();
  const cachedSongs = artistSongsCache.get(cacheKey);
  if (cachedSongs) {
    endTimer(`getAllArtistSongs:${artistId}`);
    return cachedSongs;
  }
  
  try {
    let page = 1;
    let allSongs: Song[] = [];
    let hasMoreSongs = true;
    
    // Fetch up to 5 pages (250 songs max)
    while (hasMoreSongs && page <= 5) {
      const songs = await getArtistSongs(artistId, page);
      allSongs = [...allSongs, ...songs];
      
      hasMoreSongs = songs.length === 50; // If we get less than 50 songs, we've reached the end
      page++;
    }
    
    // Cache the result
    artistSongsCache.set(cacheKey, allSongs);
    
    endTimer(`getAllArtistSongs:${artistId}`);
    return allSongs;
  } catch (error) {
    logError(`Error getting all songs for artist ID ${artistId}`, error);
    endTimer(`getAllArtistSongs:${artistId}`);
    throw error;
  }
}

/**
 * Get detailed information about a song
 */
export async function getSongDetails(songId: number): Promise<Song> {
  startTimer(`getSongDetails:${songId}`);
  
  // Check cache first
  const cacheKey = songId.toString();
  const cachedSong = songDetailsCache.get(cacheKey);
  if (cachedSong) {
    endTimer(`getSongDetails:${songId}`);
    return cachedSong;
  }
  
  try {
    const data = await fetchFromGenius(`/songs/${songId}`);
    const song = data.response.song;
    
    // Cache the result
    songDetailsCache.set(cacheKey, song);
    
    endTimer(`getSongDetails:${songId}`);
    return song;
  } catch (error) {
    logError(`Error getting song details for song ID ${songId}`, error);
    endTimer(`getSongDetails:${songId}`);
    throw error;
  }
}

/**
 * Get detailed information about an artist
 */
async function getArtistDetails(artistId: number): Promise<Artist> {
  try {
    const data = await fetchFromGenius(`/artists/${artistId}`);
    return data.response.artist;
  } catch (error) {
    logError(`Error getting artist details for artist ID ${artistId}`, error);
    throw error;
  }
}

// Helper function to sanitize image URLs
function sanitizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith('http')) return undefined;
  
  // Return the URL if it seems valid
  return url;
}

/**
 * Extract producers from a list of songs and get their details
 */
export async function getProducersFromSongs(songs: Song[]): Promise<Producer[]> {
  startTimer('getProducersFromSongs');
  
  try {
    // Collect all producer artists from the songs
    const producerMap = new Map<number, Producer>();
    
    // Process songs in batches of 5 to avoid rate limits
    const batchSize = 5;
    
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      
      // Process this batch of songs in parallel
      await Promise.all(batch.map(async (song) => {
        // If the song doesn't have producer info, try to get detailed info
        if (!song.producer_artists || song.producer_artists.length === 0) {
          try {
            const songDetails = await getSongDetails(song.id);
            
            // If songDetails has producer_artists, use them
            if (songDetails.producer_artists && songDetails.producer_artists.length > 0) {
              await processProducers(songDetails.producer_artists, songDetails, producerMap);
            }
            
            // Check for producers in custom_performances
            if (songDetails.custom_performances) {
              for (const performance of songDetails.custom_performances) {
                if (performance.label.toLowerCase().includes('produc')) {
                  await processProducers(performance.artists, songDetails, producerMap);
                }
              }
            }
          } catch (error) {
            logError(`Error getting details for song ID ${song.id}`, error);
          }
        } else {
          // The song already has producer_artists
          await processProducers(song.producer_artists, song, producerMap);
        }
      }));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < songs.length) {
        await delay(500);
      }
    }
    
    const producers = Array.from(producerMap.values());
    
    endTimer('getProducersFromSongs');
    return producers;
  } catch (error) {
    logError('Error getting producers from songs', error);
    endTimer('getProducersFromSongs');
    return [];
  }
}

/**
 * Helper function to process producers
 */
async function processProducers(
  producers: Artist[],
  song: Song,
  producerMap: Map<number, Producer>
): Promise<void> {
  for (const producer of producers) {
    // Skip if we already have this producer's full details
    if (producerMap.has(producer.id) && producerMap.get(producer.id)!.genius_url) {
      // Just add the song to the producer's notable songs
      const existingProducer = producerMap.get(producer.id)!;
      if (!existingProducer.notable_songs.some((s: {title: string}) => s.title === song.title)) {
        existingProducer.notable_songs.push({
          title: song.title,
          artist: song.primary_artist.name,
          release_date: song.release_date
        });
      }
      continue;
    }
    
    // Check cache for producer details
    const cachedProducer = producerDetailsCache.get(producer.id.toString());
    
    if (cachedProducer) {
      // Use cached producer data, but ensure this song is in notable_songs
      if (!cachedProducer.notable_songs.some((s: {title: string}) => s.title === song.title)) {
        cachedProducer.notable_songs.push({
          title: song.title,
          artist: song.primary_artist.name,
          release_date: song.release_date
        });
      }
      
      producerMap.set(producer.id, cachedProducer);
      continue;
    }
    
    // Get more details about this producer
    try {
      const artistDetails = await getArtistDetails(producer.id);
      
      const producerObj: Producer = {
        id: producer.id,
        name: producer.name,
        image_url: sanitizeImageUrl(artistDetails.image_url) || sanitizeImageUrl(producer.image_url),
        instagram_name: artistDetails.instagram_name || producer.instagram_name,
        twitter_name: artistDetails.twitter_name || producer.twitter_name,
        genius_url: artistDetails.url,
        bio: artistDetails.description?.plain,
        notable_songs: [{
          title: song.title,
          artist: song.primary_artist.name,
          release_date: song.release_date
        }]
      };
      
      // Cache this producer's details
      producerDetailsCache.set(producer.id.toString(), producerObj);
      
      // Add to our map
      producerMap.set(producer.id, producerObj);
    } catch (error) {
      // If we can't get details, just use the basic info
      logError(`Error getting details for producer ID ${producer.id}`, error);
      
      if (!producerMap.has(producer.id)) {
        producerMap.set(producer.id, {
          id: producer.id,
          name: producer.name,
          image_url: sanitizeImageUrl(producer.image_url),
          genius_url: producer.url,
          notable_songs: [{
            title: song.title,
            artist: song.primary_artist.name,
            release_date: song.release_date
          }]
        });
      }
    }
    
    // Small delay between producer detail requests to avoid rate limiting
    await delay(300);
  }
} 