import { NextResponse } from 'next/server';
import { searchArtist, getAllArtistSongs, getProducersFromSongs } from '@/app/lib/genius';
import { logInfo, logError, startTimer, endTimer } from '@/app/lib/logger';
import { artistSongsCache } from '@/app/lib/cache';

// Calculate Locked In rating for sorting
function calculateLockedInRating(songs, artistName) {
  // If no songs, return 0
  if (!songs.length || !artistName) {
    return { score: 0, tierRank: 0 };
  }

  // Parse release dates from songs and filter out invalid dates
  const validSongs = songs.filter(song => song.release_date);
  
  if (!validSongs.length) {
    return { score: 0, tierRank: 0 };
  }

  // Convert release dates to timestamps
  const releaseDates = validSongs.map(song => {
    try {
      return new Date(song.release_date || "").getTime();
    } catch (error) {
      return 0;
    }
  }).filter(date => date > 0);

  if (!releaseDates.length) {
    return { score: 0, tierRank: 0 };
  }

  // Find the earliest and latest release dates
  const earliestDate = Math.min(...releaseDates);
  const latestDate = Math.max(...releaseDates);
  
  // Calculate the total timespan
  const timespan = latestDate - earliestDate;
  
  // Handle very short timespans
  if (timespan < 1000 * 60 * 60 * 24) { 
    // Return score and tier rank for occasional/single project collaborators
    return { 
      score: validSongs.length > 3 ? 65 : 40, 
      tierRank: 1 // Occasional collaborator tier rank
    };
  }
  
  // Lower base score per song
  const baseScorePerSong = 12;
  const maxSongScore = 60;
  
  // Calculate base score from number of songs
  const songCountScore = Math.min(maxSongScore, validSongs.length * baseScorePerSong);
  
  // Calculate distribution score
  const sortedDates = [...releaseDates].sort((a, b) => a - b);
  let distributionScore = 0;
  
  if (sortedDates.length >= 3) {
    const dateGaps = [];
    for (let i = 1; i < sortedDates.length; i++) {
      const gap = (sortedDates[i] - sortedDates[i-1]) / timespan;
      dateGaps.push(gap);
    }
    
    const avgGap = dateGaps.reduce((sum, gap) => sum + gap, 0) / dateGaps.length;
    distributionScore = Math.min(15, (1 - avgGap) * 20);
  }
  
  // Time span bonus
  const timespanYears = timespan / (1000 * 60 * 60 * 24 * 365);
  const timespanBonus = Math.min(10, timespanYears * 4);
  
  // Consistency bonus
  const uniqueYears = new Set(validSongs.map(song => song.release_date?.slice(0, 4))).size;
  const consistencyBonus = Math.min(15, uniqueYears * 4);
  
  // Calculate final score
  const totalScore = Math.min(100, 
    songCountScore + 
    distributionScore + 
    timespanBonus + 
    consistencyBonus
  );
  
  // Determine tier rank based on score
  let tierRank;
  if (totalScore >= 92) {
    tierRank = 6; // Diamond
  } else if (totalScore >= 78) {
    tierRank = 5; // Platinum
  } else if (totalScore >= 55) {
    tierRank = 4; // Gold
  } else if (totalScore >= 35) {
    tierRank = 3; // Silver
  } else {
    tierRank = 2; // Bronze (still higher than occasional collaborator)
  }
  
  return { 
    score: Math.round(totalScore),
    tierRank
  };
}

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

    // NEW: Calculate Locked In rating for each producer and add to object
    const producersWithRating = contextProducers.map(producer => {
      const ratingData = calculateLockedInRating(producer.notable_songs, artist.name);
      return {
        ...producer,
        lockedInRating: ratingData.score,
        tierRank: ratingData.tierRank
      };
    });

    // NEW: Sort producers by tier rank first, then by Locked In score
    producersWithRating.sort((a, b) => {
      // First compare tier ranks (higher tier rank comes first)
      if (b.tierRank !== a.tierRank) {
        return b.tierRank - a.tierRank;
      }
      // If tier ranks are the same, sort by score
      return b.lockedInRating - a.lockedInRating;
    });

    // End the timer for the entire search request
    const duration = endTimer('API:search');
    
    return NextResponse.json({ 
      artist: {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url
      },
      producers: producersWithRating,
      performance: {
        total_time_ms: duration,
        song_count: songs.length,
        producer_count: producersWithRating.length
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