import NodeCache from 'node-cache';
export const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });
export function clearCache(key) {
    if (key) {
        cache.del(key);
    }
    else {
        cache.flushAll();
    }
}
//# sourceMappingURL=cache.js.map