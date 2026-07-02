import { MemoryCacheProvider } from './memory-cache.provider';

describe('MemoryCacheProvider', () => {
  let cache: MemoryCacheProvider;

  beforeEach(() => {
    cache = new MemoryCacheProvider();
  });

  it('stores and retrieves values', async () => {
    await cache.set('key', { ok: true });
    await expect(cache.get('key')).resolves.toEqual({ ok: true });
  });

  it('returns null for missing keys', async () => {
    await expect(cache.get('missing')).resolves.toBeNull();
  });

  it('expires entries after ttl', async () => {
    await cache.set('temp', 'value', 1);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(cache.get('temp')).resolves.toBeNull();
  });

  it('deletes entries', async () => {
    await cache.set('key', 'value');
    await cache.del('key');
    await expect(cache.get('key')).resolves.toBeNull();
  });
});
