'use client';

import { useState, FormEvent } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchInput({ onSearch, isLoading = false }: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an artist..."
          className="w-full px-5 py-4 pl-6 pr-14 rounded-xl bg-[#232845] border border-[#36416e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4359c6] focus:border-transparent shadow-lg transition-all duration-200"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 hover:bg-[#2a3154] rounded-lg transition-all duration-200"
          disabled={isLoading || !query.trim()}
        >
          <MagnifyingGlassIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="text-center mt-2 text-xs text-gray-400">
        Find the producers behind your favorite artists 🔍
      </div>
    </form>
  );
} 