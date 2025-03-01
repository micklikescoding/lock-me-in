import { NextResponse } from 'next/server';
import { searchArtist, getAllArtistSongs, getProducersFromSongs } from '@/app/lib/genius';
import { logInfo, logError, startTimer, endTimer } from '@/app/lib/logger';
import { artistSongsCache } from '@/app/lib/cache';

export async function GET(request: Request) {
  // Start a timer for the entire search request
  startTimer('API:search');
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      logInfo('Search request missing query parameter');
      endTimer('API:search');
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    logInfo(`Searching for artist: ${query}`);

    // Search for the artist
    const artists = await searchArtist(query);
    
    if (!artists.length) {
      logInfo(`No artists found for query: ${query}`);
      endTimer('API:search');
      return NextResponse.json(
        { error: 'No artists found' },
        { status: 404 }
      );
    }

    const artist = artists[0];
    logInfo(`Found artist: ${artist.name}`, { artistId: artist.id });

    // Check if this is a first-time search by checking if artist songs are in cache
    const isFirstTimeSearch = !artistSongsCache.get(artist.id.toString());
    logInfo(`First time search for ${artist.name}: ${isFirstTimeSearch}`);
    
    // Get the first artist's songs
    logInfo(`Fetching songs for artist: ${artist.name}`, { artistId: artist.id });
    const songs = await getAllArtistSongs(artist.id);
    logInfo(`Found ${songs.length} songs for artist: ${artist.name}`);
    
    // Get producers from the songs
    logInfo('Extracting producer information from songs');
    const producers = await getProducersFromSongs(songs);
    logInfo(`Found ${producers.length} producers`);

    // Create a context-aware version of the producers for this specific artist
    // This ensures songs are properly filtered for this artist regardless of cache state
    const contextProducers = producers.map(producer => {
      // Create a deep copy of the producer to avoid modifying the cached version
      return {
        ...producer,
        // Filter notable songs to only include songs from the searched artist
        notable_songs: producer.notable_songs.filter(song => 
          song.artist.toLowerCase() === artist.name.toLowerCase() ||
          // Also match using word boundaries to catch exact artist name
          new RegExp(`\\b${artist.name.toLowerCase()}\\b`, 'i').test(song.artist.toLowerCase())
        )
      };
    }).filter(producer => producer.notable_songs.length > 0);

    // Sort producers by number of songs for this specific artist
    contextProducers.sort((a, b) => b.notable_songs.length - a.notable_songs.length);

    // End the timer for the entire search request
    const duration = endTimer('API:search');
    
    return NextResponse.json({ 
      artist: {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url
      },
      producers: contextProducers,
      performance: {
        total_time_ms: duration,
        song_count: songs.length,
        producer_count: contextProducers.length
      },
      isFirstTimeSearch: isFirstTimeSearch
    });
  } catch (error) {
    logError('Search error:', error);
    endTimer('API:search');
    return NextResponse.json(
      { error: 'Failed to search for producers' },
      { status: 500 }
    );
  }
} 