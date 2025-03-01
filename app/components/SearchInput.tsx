'use client';

import { FormEvent, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Don't search if the query is empty or if we're already loading
    if (!query.trim() || isLoading) return;
    
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search for an artist (e.g., Drake, Taylor Swift, The Weeknd)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 p-2 rounded-md text-gray-300 hover:text-white focus:outline-none disabled:opacity-50"
          aria-label="Search"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
} 