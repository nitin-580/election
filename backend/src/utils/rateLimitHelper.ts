import { cacheGet, cacheSet, cacheDel } from '../config/redis';

const MAX_FAILURES = 5;
const LOCK_TIME_SECONDS = 15 * 60; // 15 minutes

export const getFailedAttempts = async (username: string): Promise<number> => {
  const key = `login_fail:${username}`;
  const val = await cacheGet<number>(key);
  return val || 0;
};

export const incrementFailedAttempts = async (username: string): Promise<{ attempts: number; locked: boolean }> => {
  const key = `login_fail:${username}`;
  const attempts = (await getFailedAttempts(username)) + 1;
  
  if (attempts >= MAX_FAILURES) {
    // Lock the account for 15 minutes
    await cacheSet(key, attempts, LOCK_TIME_SECONDS);
    await cacheSet(`login_lock:${username}`, Date.now() + LOCK_TIME_SECONDS * 1000, LOCK_TIME_SECONDS);
    return { attempts, locked: true };
  }

  // Set with sliding window or fixed 15-minute expiry
  await cacheSet(key, attempts, LOCK_TIME_SECONDS);
  return { attempts, locked: false };
};

export const resetFailedAttempts = async (username: string): Promise<void> => {
  await cacheDel(`login_fail:${username}`);
  await cacheDel(`login_lock:${username}`);
};

export const getLockExpiry = async (username: string): Promise<number | null> => {
  const expiry = await cacheGet<number>(`login_lock:${username}`);
  if (expiry && expiry > Date.now()) {
    return expiry;
  }
  return null;
};
