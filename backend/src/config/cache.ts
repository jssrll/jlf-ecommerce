import NodeCache from 'node-cache';

// Cache for 30 seconds to avoid hitting Sheets API limits
export const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

export function clearCache(key?: string) {
  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
}