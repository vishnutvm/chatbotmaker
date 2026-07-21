import { ASSISTANT_PURPOSE_PRESETS, ASSISTANT_PURPOSES } from './assistant-presets';

describe('ASSISTANT_PURPOSE_PRESETS', () => {
  it('defines a complete preset for every purpose', () => {
    for (const purpose of ASSISTANT_PURPOSES) {
      const preset = ASSISTANT_PURPOSE_PRESETS[purpose];
      expect(preset.welcomeMessage.trim().length).toBeGreaterThan(0);
      expect(preset.instructions.trim().length).toBeGreaterThan(0);
      expect(preset.tone).toBeTruthy();
    }
  });
});
