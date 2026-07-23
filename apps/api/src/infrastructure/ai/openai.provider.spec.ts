import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { OpenAiProvider } from './openai.provider';

const mockChatCreate = jest.fn();
const mockEmbeddingsCreate = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockChatCreate(...args),
      },
    },
    embeddings: {
      create: (...args: unknown[]) => mockEmbeddingsCreate(...args),
    },
  })),
);

describe('OpenAiProvider', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.AI_DEFAULT_MODEL;
  const originalEmbedModel = process.env.AI_EMBEDDING_MODEL;

  afterEach(() => {
    mockChatCreate.mockReset();
    mockEmbeddingsCreate.mockReset();
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
    if (originalEmbedModel === undefined) {
      delete process.env.AI_EMBEDDING_MODEL;
    } else {
      process.env.AI_EMBEDDING_MODEL = originalEmbedModel;
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

  it('throws AI_NOT_CONFIGURED when embed is called without API key', async () => {
    delete process.env.OPENAI_API_KEY;
    const provider = new OpenAiProvider();

    await expect(provider.embed('hello')).rejects.toBeInstanceOf(ServiceUnavailableException);

    try {
      await provider.embed(['hello', 'world']);
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

  it('chat returns mapped completion with usage', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockChatCreate.mockResolvedValue({
      id: 'chatcmpl_1',
      model: 'gpt-4o-mini',
      choices: [{ message: { content: 'Hello' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
    });

    const provider = new OpenAiProvider();
    const result = await provider.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 16,
      temperature: 0.2,
      signal: AbortSignal.timeout(5_000),
    });

    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        max_tokens: 16,
        temperature: 0.2,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result).toEqual({
      id: 'chatcmpl_1',
      model: 'gpt-4o-mini',
      content: 'Hello',
      finishReason: 'stop',
      usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 },
    });
  });

  it('chat falls back when id/model/content/usage are missing', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockChatCreate.mockResolvedValue({
      id: '',
      model: '',
      choices: [],
      usage: null,
    });

    const provider = new OpenAiProvider();
    const result = await provider.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 8,
    });

    expect(result.id).toMatch(/^chatcmpl_/);
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.content).toBe('');
    expect(result.finishReason).toBeNull();
    expect(result.usage).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
  });

  it('chat maps partial usage token fields to null', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockChatCreate.mockResolvedValue({
      id: 'chatcmpl_partial',
      model: 'gpt-4o-mini',
      choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
      usage: {},
    });

    const provider = new OpenAiProvider();
    const result = await provider.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 8,
    });

    expect(result.usage).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
  });

  it('maps non-Error provider failures to AI_PROVIDER_ERROR', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockChatCreate.mockRejectedValue('string failure');

    const provider = new OpenAiProvider();
    await expect(
      provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 8,
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('chat maps upstream failures to AI_PROVIDER_ERROR', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockChatCreate.mockRejectedValue(new Error('upstream down'));

    const provider = new OpenAiProvider();
    await expect(
      provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 8,
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('chat rethrows AbortError without wrapping', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockChatCreate.mockRejectedValue(abortError);

    const provider = new OpenAiProvider();
    await expect(
      provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 8,
      }),
    ).rejects.toBe(abortError);
  });

  it('rethrows AI_NOT_CONFIGURED ServiceUnavailableException as-is', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const notConfigured = new ServiceUnavailableException({
      statusCode: 503,
      code: 'AI_NOT_CONFIGURED',
      message: 'AI provider is not configured',
    });
    mockChatCreate.mockRejectedValue(notConfigured);

    const provider = new OpenAiProvider();
    await expect(
      provider.chat({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 8,
      }),
    ).rejects.toBe(notConfigured);
  });

  it('stream yields deltas then done with usage', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    async function* chunks() {
      yield {
        id: 'chatcmpl_stream',
        choices: [{ delta: { content: 'Hel' }, finish_reason: null }],
      };
      yield {
        id: 'chatcmpl_stream',
        choices: [{ delta: { content: 'lo' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };
    }
    mockChatCreate.mockResolvedValue(chunks());

    const provider = new OpenAiProvider();
    const received: unknown[] = [];
    for await (const chunk of provider.stream({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 16,
      temperature: 0,
    })) {
      received.push(chunk);
    }

    expect(received).toEqual([
      { type: 'delta', content: 'Hel' },
      { type: 'delta', content: 'lo' },
      {
        type: 'done',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        id: 'chatcmpl_stream',
      },
    ]);
  });

  it('stream stops early when signal is aborted', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const controller = new AbortController();
    async function* chunks() {
      yield { id: 'c1', choices: [{ delta: { content: 'A' }, finish_reason: null }] };
      controller.abort();
      yield { id: 'c1', choices: [{ delta: { content: 'B' }, finish_reason: null }] };
    }
    mockChatCreate.mockResolvedValue(chunks());

    const provider = new OpenAiProvider();
    const received: unknown[] = [];
    for await (const chunk of provider.stream({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 8,
      signal: controller.signal,
    })) {
      received.push(chunk);
    }

    expect(received).toEqual([
      { type: 'delta', content: 'A' },
      {
        type: 'done',
        finishReason: null,
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
        id: 'c1',
      },
    ]);
  });

  it('stream maps create failures to AI_PROVIDER_ERROR', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockChatCreate.mockRejectedValue(new Error('stream failed'));

    const provider = new OpenAiProvider();
    await expect(async () => {
      for await (const _ of provider.stream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 8,
      })) {
        // drain
      }
    }).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('stream maps iteration failures to AI_PROVIDER_ERROR', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    async function* chunks() {
      yield { id: 'c1', choices: [{ delta: { content: 'A' }, finish_reason: null }] };
      throw new Error('mid-stream');
    }
    mockChatCreate.mockResolvedValue(chunks());

    const provider = new OpenAiProvider();
    await expect(async () => {
      for await (const _ of provider.stream({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 8,
      })) {
        // drain
      }
    }).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('embed returns a single vector for string input', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.AI_EMBEDDING_MODEL = 'text-embedding-3-large';
    mockEmbeddingsCreate.mockResolvedValue({
      data: [
        { index: 1, embedding: [0.2, 0.3] },
        { index: 0, embedding: [0.1, 0.2] },
      ],
    });

    const provider = new OpenAiProvider();
    const vector = await provider.embed('hello');

    expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
      {
        model: 'text-embedding-3-large',
        input: 'hello',
      },
      undefined,
    );
    expect(vector).toEqual([0.1, 0.2]);
  });

  it('embed returns vectors for array input and defaults model', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    delete process.env.AI_EMBEDDING_MODEL;
    mockEmbeddingsCreate.mockResolvedValue({
      data: [
        { index: 0, embedding: [0.1] },
        { index: 1, embedding: [0.2] },
      ],
    });

    const provider = new OpenAiProvider();
    const vectors = await provider.embed(['a', 'b']);

    expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
      {
        model: 'text-embedding-3-small',
        input: ['a', 'b'],
      },
      undefined,
    );
    expect(vectors).toEqual([[0.1], [0.2]]);
  });

  it('embed maps provider errors to BadGatewayException', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockEmbeddingsCreate.mockRejectedValue(new Error('embed failed'));

    const provider = new OpenAiProvider();
    await expect(provider.embed('hello')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('embed returns empty vector when response data is empty for string input', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    mockEmbeddingsCreate.mockResolvedValue({ data: [] });

    const provider = new OpenAiProvider();
    await expect(provider.embed('hello')).resolves.toEqual([]);
  });
});
