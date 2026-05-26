import { describe, expect, it } from 'vitest';

import { langToSpeechCode } from './use-speech';

describe('langToSpeechCode', () => {
  it('FE-05 maps tr', () => {
    expect(langToSpeechCode('tr')).toBe('tr-TR');
  });

  it('FE-05 maps en', () => {
    expect(langToSpeechCode('en')).toBe('en-US');
  });

  it('FE-05 maps de', () => {
    expect(langToSpeechCode('de')).toBe('de-DE');
  });
});
