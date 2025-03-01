import { logInfo } from './logger';
import type { Artist, Song, Producer } from './genius';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache<T> {
  private store: Map<string, CacheEntry<T>>;
  private name: string;

  constructor(name: string) {
    this.store = new Map();
    this.name = name;
  }

  set(key: string, value: T): void {
    logInfo(`Cache: Setting ${this.name} cache for key: ${key}`);
    this.store.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      logInfo(`Cache: ${this.name} cache expired for key: ${key}`);
      this.store.delete(key);
      return null;
    }

    logInfo(`Cache: Hit ${this.name} cache for key: ${key}`);
    return entry.data;
  }

  clear(): void {
    logInfo(`Cache: Clearing ${this.name} cache`);
    this.store.clear();
  }
}

// Create separate caches for different types of data
export const artistSearchCache = new Cache<Artist[]>('artistSearch');
export const artistSongsCache = new Cache<Song[]>('artistSongs');
export const songDetailsCache = new Cache<Song>('songDetails');
export const producerDetailsCache = new Cache<Producer>('producerDetails'); 