import { createClient } from 'redis';

let redisClient: any = null;
let isRedisConnected = false;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err: any) => {
      console.warn('Redis client error, falling back to memory storage:', err.message);
      isRedisConnected = false;
    });
    await redisClient.connect();
    isRedisConnected = true;
    console.log('Redis connected successfully');
  } catch (error: any) {
    console.warn('Redis connection failed, falling back to memory storage:', error.message);
    redisClient = null;
    isRedisConnected = false;
  }
};

export const getRedisClient = () => {
  if (isRedisConnected && redisClient) {
    return redisClient;
  }
  return null;
};

// Memory fallback cache store
const memoryCache: Record<string, { value: any; expiry: number }> = {};

export const cacheSet = async (key: string, value: any, expirySeconds: number = 300) => {
  const client = getRedisClient();
  if (client) {
    try {
      await client.set(key, JSON.stringify(value), { EX: expirySeconds });
      return;
    } catch (err) {
      console.warn('Failed to set cache in Redis, writing to memory:', err);
    }
  }
  memoryCache[key] = {
    value,
    expiry: Date.now() + expirySeconds * 1000,
  };
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  if (client) {
    try {
      const data = await client.get(key);
      if (data) return JSON.parse(data) as T;
    } catch (err) {
      console.warn('Failed to get cache from Redis, reading from memory:', err);
    }
  }
  const item = memoryCache[key];
  if (item && item.expiry > Date.now()) {
    return item.value as T;
  }
  if (item) {
    delete memoryCache[key]; // expired
  }
  return null;
};

export const cacheDel = async (key: string) => {
  const client = getRedisClient();
  if (client) {
    try {
      await client.del(key);
      return;
    } catch (err) {
      console.warn('Failed to delete cache in Redis, deleting from memory:', err);
    }
  }
  delete memoryCache[key];
};
