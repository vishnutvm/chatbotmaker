import { PublishableKeyHasher, PK_LIVE_PATTERN } from './publishable-key.hasher';

describe('PublishableKeyHasher', () => {
  const originalPepper = process.env.PUBLISHABLE_KEY_PEPPER;

  beforeEach(() => {
    process.env.PUBLISHABLE_KEY_PEPPER = 'test-pepper-alpha';
  });

  afterEach(() => {
    if (originalPepper === undefined) {
      delete process.env.PUBLISHABLE_KEY_PEPPER;
    } else {
      process.env.PUBLISHABLE_KEY_PEPPER = originalPepper;
    }
  });

  it('generates pk_live_ keys matching the format pattern', () => {
    const hasher = new PublishableKeyHasher();
    const key = hasher.generateRawKey();
    expect(key.startsWith('pk_live_')).toBe(true);
    expect(PK_LIVE_PATTERN.test(key)).toBe(true);
    expect(hasher.isValidFormat(key)).toBe(true);
  });

  it('hashes stably for the same pepper and key', () => {
    const hasher = new PublishableKeyHasher();
    const key = hasher.generateRawKey();
    expect(hasher.hash(key)).toBe(hasher.hash(key));
  });

  it('changes hash when pepper changes', () => {
    const hasher = new PublishableKeyHasher();
    const key = 'pk_live_' + 'a'.repeat(43);
    const h1 = hasher.hash(key);
    process.env.PUBLISHABLE_KEY_PEPPER = 'test-pepper-beta';
    const h2 = hasher.hash(key);
    expect(h1).not.toBe(h2);
  });

  it('builds a display prefix without the full secret', () => {
    const hasher = new PublishableKeyHasher();
    const key = 'pk_live_' + 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcde';
    const prefix = hasher.toDisplayPrefix(key);
    expect(prefix).toContain('…');
    expect(prefix.length).toBeLessThan(key.length);
    expect(prefix.startsWith('pk_live_')).toBe(true);
  });

  it('uses fallback display prefix for unexpectedly short keys', () => {
    const hasher = new PublishableKeyHasher();
    expect(hasher.toDisplayPrefix('pk_live_short')).toBe('pk_live_…');
  });

  it('compares hashes in constant time', () => {
    const hasher = new PublishableKeyHasher();
    const hex = 'a'.repeat(64);
    const other = 'b'.repeat(64);
    expect(hasher.hashesEqual(hex, hex)).toBe(true);
    expect(hasher.hashesEqual(hex, other)).toBe(false);
    expect(hasher.hashesEqual(hex, 'not-hex')).toBe(false);
    expect(hasher.hashesEqual('abc', 'abcd')).toBe(false);
  });
});
