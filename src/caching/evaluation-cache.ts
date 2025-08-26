import * as crypto from 'crypto';

// Optional Redis dependency - graceful fallback if not available
let Redis: any = null;
try {
  Redis = require('redis');
} catch (e) {
  console.log('Redis not available, using in-memory cache');
}

export interface CacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memory';
  redis_url?: string;
  ttl_seconds: number;
  max_memory_items: number;
}

export interface CacheEntry {
  result: any;
  timestamp: number;
  model_hash: string;
  sample_hash: string;
  template_config: string;
}

export interface CacheStats {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  memory_usage?: number;
  redis_connected?: boolean;
}

/**
 * Intelligent caching system for LLM evaluation results
 * Supports both Redis and in-memory caching with smart invalidation
 */
export class EvaluationCache {
  private config: CacheConfig;
  private redisClient: any = null;
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    total_requests: 0,
    cache_hits: 0,
    cache_misses: 0,
    hit_rate: 0
  };

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeCache();
  }

  private async initializeCache() {
    if (!this.config.enabled) return;

    if (this.config.provider === 'redis' && Redis) {
      try {
        this.redisClient = Redis.createClient({
          url: this.config.redis_url || 'redis://localhost:6379'
        });
        
        this.redisClient.on('error', (err: Error) => {
          console.warn('Redis error, falling back to memory cache:', err.message);
          this.redisClient = null;
        });

        await this.redisClient.connect();
        console.log('✅ Redis cache connected');
      } catch (error) {
        console.warn('Failed to connect to Redis, using memory cache:', (error as Error).message);
        this.redisClient = null;
      }
    }
  }

  /**
   * Generate cache key from model, sample, and template configuration
   */
  private generateCacheKey(model: string, sample: any, templateConfig: any): string {
    const modelHash = this.hashString(model);
    const sampleHash = this.hashString(JSON.stringify(sample));
    const templateHash = this.hashString(JSON.stringify(templateConfig));
    
    return `eval:${modelHash}:${sampleHash}:${templateHash}`;
  }

  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Get cached evaluation result
   */
  async getCachedResult(model: string, sample: any, templateConfig: any): Promise<any | null> {
    if (!this.config.enabled) return null;

    this.stats.total_requests++;
    const key = this.generateCacheKey(model, sample, templateConfig);

    try {
      let entry: CacheEntry | null = null;

      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          entry = JSON.parse(cached);
        }
      } else {
        // Fall back to memory cache
        entry = this.memoryCache.get(key) || null;
      }

      if (entry) {
        // Check if entry is still valid
        const now = Date.now();
        if (now - entry.timestamp < this.config.ttl_seconds * 1000) {
          this.stats.cache_hits++;
          this.updateHitRate();
          return entry.result;
        } else {
          // Entry expired, remove it
          await this.deleteFromCache(key);
        }
      }

      this.stats.cache_misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.warn('Cache get error:', (error as Error).message);
      this.stats.cache_misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Store evaluation result in cache
   */
  async setCachedResult(
    model: string, 
    sample: any, 
    templateConfig: any, 
    result: any
  ): Promise<void> {
    if (!this.config.enabled) return;

    const key = this.generateCacheKey(model, sample, templateConfig);
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      model_hash: this.hashString(model),
      sample_hash: this.hashString(JSON.stringify(sample)),
      template_config: this.hashString(JSON.stringify(templateConfig))
    };

    try {
      if (this.redisClient) {
        // Store in Redis with TTL
        await this.redisClient.setEx(key, this.config.ttl_seconds, JSON.stringify(entry));
      } else {
        // Store in memory cache
        this.memoryCache.set(key, entry);
        
        // Ensure we don't exceed max memory items
        if (this.memoryCache.size > this.config.max_memory_items) {
          const oldestKey = this.memoryCache.keys().next().value;
          if (oldestKey) {
            this.memoryCache.delete(oldestKey);
          }
        }
      }
    } catch (error) {
      console.warn('Cache set error:', (error as Error).message);
    }
  }

  /**
   * Invalidate all cache entries for a specific model
   */
  async invalidateModelCache(model: string): Promise<number> {
    if (!this.config.enabled) return 0;

    const modelHash = this.hashString(model);
    let deletedCount = 0;

    try {
      if (this.redisClient) {
        // Get all keys matching the pattern
        const pattern = `eval:${modelHash}:*`;
        const keys = await this.redisClient.keys(pattern);
        
        if (keys.length > 0) {
          deletedCount = await this.redisClient.del(keys);
        }
      } else {
        // Memory cache invalidation
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.model_hash === modelHash) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
      }

      console.log(`🗑️ Invalidated ${deletedCount} cache entries for model: ${model}`);
      return deletedCount;
    } catch (error) {
      console.warn('Cache invalidation error:', (error as Error).message);
      return 0;
    }
  }

  /**
   * Invalidate cache entries for a specific template type
   */
  async invalidateTemplateCache(templateType: string): Promise<number> {
    if (!this.config.enabled) return 0;

    let deletedCount = 0;

    try {
      if (this.redisClient) {
        const keys = await this.redisClient.keys('eval:*');
        
        for (const key of keys) {
          const cached = await this.redisClient.get(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            // This is a simplified check - in practice, you might want more sophisticated template matching
            if (entry.template_config.includes(templateType)) {
              await this.redisClient.del(key);
              deletedCount++;
            }
          }
        }
      } else {
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.template_config.includes(templateType)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
      }

      console.log(`🗑️ Invalidated ${deletedCount} cache entries for template: ${templateType}`);
      return deletedCount;
    } catch (error) {
      console.warn('Template cache invalidation error:', (error as Error).message);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    try {
      if (this.redisClient) {
        const keys = await this.redisClient.keys('eval:*');
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        this.memoryCache.clear();
      }

      console.log('🧹 Cache cleared successfully');
    } catch (error) {
      console.warn('Cache clear error:', (error as Error).message);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const stats = { ...this.stats };

    try {
      if (this.redisClient) {
        const info = await this.redisClient.info('memory');
        // Parse memory usage from Redis info
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          stats.memory_usage = parseInt(memoryMatch[1]);
        }
        stats.redis_connected = true;
      } else {
        // Memory cache size estimation
        stats.memory_usage = this.memoryCache.size * 1024; // Rough estimate
        stats.redis_connected = false;
      }
    } catch (error) {
      console.warn('Error getting cache stats:', (error as Error).message);
    }

    return stats;
  }

  private deleteFromCache(key: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.redisClient) {
        this.redisClient.del(key).then(() => resolve()).catch(() => resolve());
      } else {
        this.memoryCache.delete(key);
        resolve();
      }
    });
  }

  private updateHitRate(): void {
    this.stats.hit_rate = this.stats.total_requests > 0 
      ? this.stats.cache_hits / this.stats.total_requests 
      : 0;
  }

  /**
   * Close cache connections
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; stats: CacheStats }> {
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
      }

      const stats = await this.getCacheStats();
      return {
        healthy: true,
        message: this.redisClient ? 'Redis cache healthy' : 'Memory cache healthy',
        stats
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Cache health check failed: ${(error as Error).message}`,
        stats: this.stats
      };
    }
  }
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  provider: 'memory',
  ttl_seconds: 3600, // 1 hour
  max_memory_items: 1000
};

/**
 * Create cache instance with configuration
 */
export function createEvaluationCache(config?: Partial<CacheConfig>): EvaluationCache {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  return new EvaluationCache(finalConfig);
}
