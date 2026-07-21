import { ModelRouter } from './model-router';

describe('ModelRouter', () => {
  const original = process.env.AI_DEFAULT_MODEL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AI_DEFAULT_MODEL;
    } else {
      process.env.AI_DEFAULT_MODEL = original;
    }
  });

  it('returns the configured default model and ignores org id', () => {
    process.env.AI_DEFAULT_MODEL = 'gpt-4o-mini';
    const router = new ModelRouter();
    expect(router.resolveChatModel('any-org')).toBe('gpt-4o-mini');
  });
});
