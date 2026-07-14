import { ServiceUnavailableException } from '@nestjs/common';
import { OpenAiProvider } from './openai.provider';

describe('OpenAiProvider', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.AI_DEFAULT_MODEL;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
    if (originalModel === undefined) {
      delete process.env.AI_DEFAULT_MODEL;
    } else {
      process.env.AI_DEFAULT_MODEL = originalModel;
    }
  });

  it('throws AI_NOT_CONFIGURED when API key is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const provider = new OpenAiProvider();

    await expect(
      provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 16,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    try {
      await provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 16,
      });
    } catch (error) {
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        code: 'AI_NOT_CONFIGURED',
      });
    }
  });

  it('exposes default model helper', () => {
    process.env.AI_DEFAULT_MODEL = 'gpt-4o-mini';
    const provider = new OpenAiProvider();
    expect(provider.getDefaultModel()).toBe('gpt-4o-mini');
  });
});
