import { NextResponse } from 'next/server';
import { searchArtist, getAllArtistSongs, getProducersFromSongs } from '@/app/lib/genius';
import { logInfo, logError, startTimer, endTimer } from '@/app/lib/logger';

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

    // Get the first artist's songs
    logInfo(`Fetching songs for artist: ${artist.name}`, { artistId: artist.id });
    const songs = await getAllArtistSongs(artist.id);
    logInfo(`Found ${songs.length} songs for artist: ${artist.name}`);
    
    // Get producers from the songs
    logInfo('Extracting producer information from songs');
    const producers = await getProducersFromSongs(songs);
    logInfo(`Found ${producers.length} producers`);

    // Sort producers by number of songs
    producers.sort((a, b) => b.notable_songs.length - a.notable_songs.length);

    // End the timer for the entire search request
    const duration = endTimer('API:search');
    
    return NextResponse.json({ 
      artist: {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url
      },
      producers,
      performance: {
        total_time_ms: duration,
        song_count: songs.length,
        producer_count: producers.length
      }
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