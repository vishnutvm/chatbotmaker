import { BadRequestException } from '@nestjs/common';
import { PromptAssembler } from './prompt.assembler';

describe('PromptAssembler', () => {
  const assembler = new PromptAssembler();

  it('prepends systemPrompt when provided', () => {
    const messages = assembler.assemble({
      systemPrompt: 'You are helpful.',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(messages).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
  });

  it('trims roles and content', () => {
    const messages = assembler.assemble({
      messages: [{ role: 'user', content: '  Hi  ' }],
    });

    expect(messages).toEqual([{ role: 'user', content: 'Hi' }]);
  });

  it('rejects empty message content after trim', () => {
    expect(() =>
      assembler.assemble({
        messages: [{ role: 'user', content: '   ' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects empty systemPrompt after trim', () => {
    expect(() =>
      assembler.assemble({
        systemPrompt: '  ',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects oversized assembled prompt', () => {
    const huge = 'x'.repeat(50_001);
    expect(() =>
      assembler.assemble({
        systemPrompt: huge,
        messages: [{ role: 'user', content: huge }],
      }),
    ).toThrow(/soft limit/);
  });
});
