'use client';

import { useState } from 'react';
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
  const [performance, setPerformance] = useState<{
    total_time_ms: number;
    song_count: number;
    producer_count: number;
  } | null>(null);

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
    } catch (err) {
      // Handle any errors
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      // Set loading to false regardless of outcome
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header section */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Lock Me In
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Find producers who have worked with your favorite artists
        </p>
      </header>

      {/* Search input */}
      <div className="mb-10">
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />
      </div>

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
          <h2 className="text-2xl font-semibold">
            Producers who worked with <span className="text-blue-400">{artistName}</span>
          </h2>
          <p className="text-gray-400">Found {producers.length} producers</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-center p-4 bg-red-900/30 border border-red-700 rounded-lg mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results grid */}
      {producers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {producers.map((producer) => (
            <ProducerCard key={producer.id} producer={producer} />
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center p-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Searching for producers...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a minute for popular artists</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && producers.length === 0 && !artistName && (
        <div className="text-center text-gray-400 p-12 border border-gray-800 rounded-lg">
          <p>Search for an artist to discover producers who have worked with them</p>
          <p className="text-sm mt-2 text-gray-500">
            Try artists like Drake, Taylor Swift, or Kendrick Lamar
          </p>
        </div>
      )}

      {/* No results found */}
      {!isLoading && !error && producers.length === 0 && artistName && (
        <div className="text-center text-gray-400 p-8 border border-gray-800 rounded-lg">
          <p>No producers found for {artistName}</p>
          <p className="text-sm mt-2 text-gray-500">
            Try searching for a different artist
          </p>
        </div>
      )}
    </div>
  );
}
