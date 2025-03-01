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
        <div className="w-16 h-16 relative rounded-full overflow-hidden flex-shrink-0">
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
      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
        {producer.name.charAt(0)}
      </div>
    );
  };

  // Counter text: show filtering context if filtered
  const songCountText = filteredSongs.length > 0 && filteredSongs.length !== producer.notable_songs.length
    ? `${filteredSongs.length} songs with ${artistName} (${producer.notable_songs.length} total)`
    : `${producer.notable_songs.length} tracked songs`;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-gray-500 transition-all">
      <div className="p-5">
        {/* Producer header with image and name */}
        <div className="flex items-center gap-4 mb-4">
          {renderAvatar()}
          
          <div>
            <h2 className="text-xl font-bold text-white">{producer.name}</h2>
            <p className="text-gray-400 text-sm">{songCountText}</p>
          </div>
        </div>
        
        {/* Bio section */}
        {producer.bio && (
          <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-300 mb-1">Bio</h3>
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
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-xs hover:bg-gray-600 transition-colors"
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
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-xs hover:bg-gray-600 transition-colors"
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
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-xs hover:bg-gray-600 transition-colors"
            >
              <span>Twitter</span>
              <LinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
        
        {/* Notable songs */}
        <div>
          <h3 className="text-md font-semibold text-gray-300 mb-2">Notable Songs</h3>
          
          {songsToDisplay.length > 0 ? (
            <ul className="space-y-2">
              {visibleSongs.map((song, index) => (
                <li key={index} className="bg-gray-700 p-2 rounded text-sm">
                  <div className="font-medium">{song.title}</div>
                  <div className="text-gray-400 text-xs">by {song.artist}</div>
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
          
          {/* Show more/less button if there are more than 3 songs */}
          {songsToDisplay.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 py-1 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1"
            >
              <span>{expanded ? 'Show less' : 'Show more'}</span>
              {expanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 