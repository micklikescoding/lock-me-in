'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Producer } from '../lib/genius';
import { LinkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ProducerCardProps {
  producer: Producer;
  artistName?: string; 
}

export default function ProducerCard({ producer, artistName }: ProducerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Filter notable songs to only show those matching the searched artist if artistName is provided
  const filteredSongs = artistName 
    ? producer.notable_songs.filter(song => {
        // This is the current search context - the artist the user searched for
        const currentSearchArtist = artistName.toLowerCase().trim();
        
        // The artist of this particular song
        const songArtist = song.artist.toLowerCase().trim();
        
        // STRICT MATCHING: We only want songs where the artist exactly matches the searched artist
        // or where the artist name is a substring surrounded by word boundaries
        return songArtist === currentSearchArtist || 
               // Check if it's an exact match for the artist name as a whole word
               new RegExp(`\\b${currentSearchArtist}\\b`, 'i').test(songArtist);
      })
    : producer.notable_songs;
  
  // Always use filtered songs - no fallback
  const songsToDisplay = filteredSongs;
  
  // Only show top 3 songs by default, show all when expanded
  const visibleSongs = expanded 
    ? songsToDisplay 
    : songsToDisplay.slice(0, 3);

  // Format social media links
  const instagramUrl = producer.instagram_name
    ? `https://instagram.com/${producer.instagram_name}`
    : null;
  
  const twitterUrl = producer.twitter_name
    ? `https://twitter.com/${producer.twitter_name}`
    : null;

  // Function to handle image load errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Use a fallback avatar approach instead of trying to fix image URLs that might not be valid
  // Simply check if we have an image URL and no error loading it 
  const hasValidImage = Boolean(
    producer.image_url && 
    typeof producer.image_url === 'string' &&
    producer.image_url.startsWith('http') && 
    !imageError
  );

  // Render content based on whether we have a valid image
  const renderAvatar = () => {
    if (hasValidImage && producer.image_url) {
      return (
        <div className="w-16 h-16 relative rounded-full overflow-hidden flex-shrink-0 border-2 border-[#36416e] shadow-lg">
          <Image 
            src={producer.image_url}
            alt={producer.name}
            fill
            sizes="64px"
            className="object-cover"
            onError={handleImageError}
            unoptimized
          />
        </div>
      );
    }
    
    // Fallback avatar with initial
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#323b6a] to-[#232845] flex items-center justify-center text-2xl font-bold flex-shrink-0 border-2 border-[#36416e] shadow-lg">
        {producer.name.charAt(0)}
      </div>
    );
  };

  // Counter text: show filtering context if filtered
  const songCountText = filteredSongs.length > 0 && filteredSongs.length !== producer.notable_songs.length
    ? `${filteredSongs.length} songs with ${artistName} (${producer.notable_songs.length} total)`
    : `${producer.notable_songs.length} tracked songs`;

  // NEW: Calculate the "Locked In" rating based on artist timeline
  const calculateLockedInRating = () => {
    // If no filtered songs or no artist name, we can't calculate a rating
    if (!filteredSongs.length || !artistName) {
      return {
        score: 0,
        level: "Not Locked In",
        color: "text-gray-400"
      };
    }

    // Parse release dates from songs and filter out invalid dates
    const validSongs = filteredSongs.filter(song => song.release_date);
    
    if (!validSongs.length) {
      return {
        score: 0,
        level: "No Release Data",
        color: "text-gray-400"
      };
    }

    // Convert release dates to timestamps
    const releaseDates = validSongs.map(song => {
      try {
        return new Date(song.release_date || "").getTime();
      } catch (_) {
        // Using underscore to indicate deliberately unused error variable
        return 0;
      }
    }).filter(date => date > 0);

    if (!releaseDates.length) {
      return {
        score: 0,
        level: "No Valid Dates",
        color: "text-gray-400"
      };
    }

    // Find the earliest and latest release dates
    const earliestDate = Math.min(...releaseDates);
    const latestDate = Math.max(...releaseDates);
    
    // Calculate the total timespan of the artist's career (that we know of)
    const timespan = latestDate - earliestDate;
    
    // If timespan is too small (e.g., only one song or songs released on same day)
    if (timespan < 1000 * 60 * 60 * 24) { // less than a day
      // Less generous rating for single-day multiple tracks
      return {
        score: validSongs.length > 3 ? 65 : 40,
        level: validSongs.length > 3 ? "Single Project Collaborator" : "Occasional Collaborator",
        color: validSongs.length > 3 ? "text-blue-400" : "text-gray-400"
      };
    }
    
    // Calculate recency score for each song (0 to 1, where 1 is most recent)
    const recencyScores = releaseDates.map(date => {
      const relativePosition = (date - earliestDate) / timespan;
      return relativePosition;
    });
    
    // IMPROVED RATING SYSTEM
    // Lower base score per song
    const baseScorePerSong = 12; // Reduced from 20 to 12
    
    // Higher cap for song count to require more songs for high ratings
    const maxSongScore = 60; // Slightly lower max song score
    
    // Calculate base score from number of songs (capped lower)
    const songCountScore = Math.min(maxSongScore, validSongs.length * baseScorePerSong);
    
    // Calculate recency distribution - are songs spread out or clustered?
    // Sort the dates and check gaps between them
    const sortedDates = [...releaseDates].sort((a, b) => a - b);
    let distributionScore = 0;
    
    // If they have 3+ songs, check distribution
    if (sortedDates.length >= 3) {
      const dateGaps = [];
      for (let i = 1; i < sortedDates.length; i++) {
        // Calculate gap as percentage of total timespan
        const gap = (sortedDates[i] - sortedDates[i-1]) / timespan;
        dateGaps.push(gap);
      }
      
      // Average gap - smaller is more clustered, larger is more spread
      const avgGap = dateGaps.reduce((sum, gap) => sum + gap, 0) / dateGaps.length;
      
      // More evenly distributed = higher score (up to 15 points)
      distributionScore = Math.min(15, (1 - avgGap) * 20);
    }
    
    // Time span bonus - longer relationship = higher score
    // Convert timespan to years for better scaling
    const timespanYears = timespan / (1000 * 60 * 60 * 24 * 365);
    const timespanBonus = Math.min(10, timespanYears * 4);
    
    // Consistency bonus (for working across different years)
    const uniqueYears = new Set(validSongs.map(song => song.release_date?.slice(0, 4))).size;
    const consistencyBonus = Math.min(15, uniqueYears * 4);
    
    // Calculate final score (cap at 100)
    const totalScore = Math.min(100, 
      songCountScore + 
      distributionScore + 
      timespanBonus + 
      consistencyBonus
    );
    
    // Determine "Locked In" level based on score with higher thresholds
    let level, color;
    if (totalScore >= 92) {
      level = "Diamond Locked 💎";
      color = "text-blue-300";
    } else if (totalScore >= 78) {
      level = "Platinum Locked ⭐";
      color = "text-purple-400";
    } else if (totalScore >= 55) {
      level = "Gold Locked 🔒";
      color = "text-yellow-400";
    } else if (totalScore >= 35) {
      level = "Silver Locked 🔓";
      color = "text-gray-300";
    } else {
      level = "Bronze Locked 🔗";
      color = "text-orange-400";
    }
    
    return {
      score: Math.round(totalScore),
      level,
      color
    };
  };

  const lockedInRating = calculateLockedInRating();

  return (
    <div className="csgo-card h-full flex flex-col">
      <div className="p-5 flex-grow">
        {/* Producer header with image and name */}
        <div className="flex items-center gap-4 mb-4">
          {renderAvatar()}
          
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {producer.name} 
              {lockedInRating.score >= 75 && <span className="text-yellow-400 text-sm">★</span>}
            </h2>
            <p className={`${lockedInRating.color} text-sm font-medium`}>{lockedInRating.level}</p>
            <p className="text-gray-400 text-xs">{songCountText}</p>
          </div>
        </div>
        
        {/* NEW: Locked In Rating Bar */}
        {lockedInRating.score > 0 && (
          <div className="mb-4 bg-[#1d2136]/70 p-3 rounded-lg">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-gray-400">Locked In Rating</span>
              <span className={`${lockedInRating.color} font-medium`}>{lockedInRating.score}%</span>
            </div>
            <div className="h-2 bg-[#232845] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${lockedInRating.score}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Bio section */}
        {producer.bio && (
          <div className="mb-4 bg-[#1d2136]/50 p-3 rounded-lg">
            <h3 className="text-md font-semibold text-gray-300 mb-1 flex items-center">
              <span className="text-sm mr-1">🎤</span> Bio
            </h3>
            <p className="text-gray-400 text-sm line-clamp-3">
              {producer.bio}
            </p>
          </div>
        )}
        
        {/* Social links */}
        <div className="flex flex-wrap gap-2 mb-4">
          {producer.genius_url && (
            <a
              href={producer.genius_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 bg-[#2a3154] rounded-full text-xs hover:bg-[#36416e] transition-colors"
            >
              <span>Genius</span>
              <LinkIcon className="w-3 h-3" />
            </a>
          )}
          
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 bg-[#2a3154] rounded-full text-xs hover:bg-[#36416e] transition-colors"
            >
              <span>Instagram</span>
              <LinkIcon className="w-3 h-3" />
            </a>
          )}
          
          {twitterUrl && (
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 bg-[#2a3154] rounded-full text-xs hover:bg-[#36416e] transition-colors"
            >
              <span>Twitter</span>
              <LinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
        
        {/* Notable songs */}
        <div>
          <h3 className="text-md font-semibold text-white mb-2 flex items-center">
            <span className="text-sm mr-1">🎵</span> Notable Songs
          </h3>
          
          {songsToDisplay.length > 0 ? (
            <ul className="space-y-2">
              {visibleSongs.map((song, index) => (
                <li key={index} className="bg-[#1d2136]/70 p-3 rounded-lg text-sm border border-[#2a305a]/30 hover:border-[#36416e]/50 transition-all">
                  <div className="font-medium text-white">{song.title}</div>
                  <div className="text-blue-400 text-xs">by {song.artist}</div>
                  {song.release_date && (
                    <div className="text-gray-500 text-xs">{song.release_date}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm italic p-2">
              No notable songs with {artistName} in our database yet.
            </div>
          )}
        </div>
      </div>
      
      {/* Show more/less button if there are more than 3 songs */}
      {songsToDisplay.length > 3 && (
        <div className="bg-[#1d2136] border-t border-[#2a305a] px-4 py-2 rounded-b-xl">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-1 text-xs text-gray-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
          >
            <span>{expanded ? 'Show less' : `Show ${songsToDisplay.length - 3} more songs`}</span>
            {expanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
} 