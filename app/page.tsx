'use client';

import { useState, useEffect } from 'react';
import SearchInput from './components/SearchInput';
import ProducerCard from './components/ProducerCard';
import PerformanceStats from './components/PerformanceStats';
import { Producer } from './lib/genius';

// Main page component with search functionality
export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [artistName, setArtistName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [knownSearches, setKnownSearches] = useState<Set<string>>(new Set());
  const [performance, setPerformance] = useState<{
    total_time_ms: number;
    song_count: number;
    producer_count: number;
  } | null>(null);

  // Load previously searched artists from localStorage on mount (only used for UI display)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('knownSearches');
      if (cached) {
        setKnownSearches(new Set(JSON.parse(cached)));
      }
    } catch (error) {
      console.error('Failed to load searches from localStorage', error);
    }
  }, []);

  // Handle the search submission
  const handleSearch = async (query: string) => {
    // Reset state for new search
    setIsLoading(true);
    setError(null);
    setProducers([]);
    setArtistName(null);
    setPerformance(null);
    
    try {
      // Call the search API endpoint
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search for producers');
      }

      // Update state with the search results
      setProducers(data.producers);
      setArtistName(data.artist.name);
      setPerformance(data.performance);
      
      // Update our local knowledge for future searches
      const newKnownSearches = new Set(knownSearches);
      newKnownSearches.add(query.toLowerCase());
      setKnownSearches(newKnownSearches);
      
      try {
        localStorage.setItem('knownSearches', JSON.stringify([...newKnownSearches]));
      } catch (error) {
        console.error('Failed to save to localStorage', error);
      }
      
    } catch (err) {
      // Handle any errors
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      // Set loading to false regardless of outcome
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header section */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text from-blue-400 to-purple-600">
          Let&apos;s Lock In 🎵
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Find producers who have worked with your favorite artists
        </p>
      </header>

      {/* Search input */}
      <div className="mb-10 max-w-xl mx-auto">
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="csgo-card p-8 text-center max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-300 font-medium">Searching for producers...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a minute for popular artists</p>
        </div>
      )}

      {/* Performance stats */}
      {performance && (
        <PerformanceStats
          totalTimeMs={performance.total_time_ms}
          songCount={performance.song_count}
          producerCount={performance.producer_count}
        />
      )}

      {/* Results heading */}
      {artistName && producers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center">
            Producers who worked with 
            <span className="gradient-text from-blue-400 to-purple-500 ml-2">{artistName}</span>
            <span className="ml-2">🔥</span>
          </h2>
          <p className="text-gray-400">Found {producers.length} producers</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="csgo-card-red p-5 mb-8 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-white font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Results grid */}
      {producers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {producers.map((producer) => (
            <ProducerCard 
              key={producer.id} 
              producer={producer} 
              artistName={artistName || undefined} 
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && producers.length === 0 && !artistName && (
        <div className="csgo-card p-8 text-center max-w-xl mx-auto">
          <div className="text-5xl mb-4">🎧</div>
          <p className="text-gray-300 font-medium mb-2">Search for an artist to discover producers who have worked with them</p>
          <p className="text-sm text-gray-400">
            Try artists like Drake, Taylor Swift, or Kendrick Lamar
          </p>
        </div>
      )}

      {/* No results found */}
      {!isLoading && !error && producers.length === 0 && artistName && (
        <div className="csgo-card p-8 text-center max-w-xl mx-auto">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-300 font-medium mb-2">No producers found for {artistName}</p>
          <p className="text-sm text-gray-400">
            Try searching for a different artist
          </p>
        </div>
      )}
    </div>
  );
}
