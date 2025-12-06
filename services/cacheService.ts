import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Cache Service - Fast AsyncStorage caching for database queries and API calls
 * 
 * Usage:
 * - Cache database queries to reduce load time
 * - Cache API responses
 * - Set custom expiration times per cache entry
 */
export const cacheService = {
  /**
   * Set cached data with expiration time
   * @param key - Unique cache key (prefix with 'cache_' automatically)
   * @param data - Data to cache
   * @param expirationMinutes - How long to keep in cache (default: 30 minutes)
   */
  async set<T>(key: string, data: T, expirationMinutes: number = 30): Promise<void> {
    try {
      const cacheKey = `cache_${key}`;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`💾 Cached: ${key} (expires in ${expirationMinutes} min)`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * Get cached data if not expired
   * @param key - Cache key to retrieve
   * @param expirationMinutes - Max age of cache (default: 30 minutes)
   * @returns Cached data or null if expired/not found
   */
  async get<T>(key: string, expirationMinutes: number = 30): Promise<T | null> {
    try {
      const cacheKey = `cache_${key}`;
      const item = await AsyncStorage.getItem(cacheKey);
      
      if (!item) {
        return null; // Cache miss
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      const age = Date.now() - entry.timestamp;
      const maxAge = expirationMinutes * 60 * 1000;

      if (age > maxAge) {
        // Expired, remove it
        console.log(`🗑️ Cache expired: ${key}`);
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`📦 Cache hit: ${key}`);
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Clear specific cache entry
   * @param key - Cache key to clear
   */
  async clear(key: string): Promise<void> {
    try {
      const cacheKey = `cache_${key}`;
      await AsyncStorage.removeItem(cacheKey);
      console.log(`🗑️ Cleared cache: ${key}`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`🗑️ Cleared all cache (${cacheKeys.length} entries)`);
      }
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  },

  /**
   * Invalidate cache for a specific key (mark as expired)
   * Useful when you know data has changed
   */
  async invalidate(key: string): Promise<void> {
    await this.clear(key);
  },

  /**
   * Get cache info (for debugging)
   */
  async getInfo(key: string): Promise<{ exists: boolean; age?: number; data?: any }> {
    try {
      const cacheKey = `cache_${key}`;
      const item = await AsyncStorage.getItem(cacheKey);
      
      if (!item) {
        return { exists: false };
      }

      const entry: CacheEntry<any> = JSON.parse(item);
      const age = Date.now() - entry.timestamp;

      return {
        exists: true,
        age: Math.floor(age / 1000), // Age in seconds
        data: entry.data,
      };
    } catch (error) {
      return { exists: false };
    }
  },
};

