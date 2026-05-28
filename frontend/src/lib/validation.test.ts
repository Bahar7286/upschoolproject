import { describe, expect, it } from 'vitest';

import { validateEmail, validatePassword, validateRequired } from './validation';

describe('validation', () => {
  it('rejects invalid email', () => {
    expect(validateEmail('')).toMatch(/gerekli/);
    expect(validateEmail('not-an-email')).toMatch(/Geçerli/);
    expect(validateEmail('a@b.co')).toBeNull();
  });

  it('validates password length', () => {
    expect(validatePassword('123')).toMatch(/en az/);
    expect(validatePassword('123456')).toBeNull();
  });

  it('validates required fields', () => {
    expect(validateRequired('  ', 'Ad')).toMatch(/Ad/);
    expect(validateRequired('Ali', 'Ad')).toBeNull();
  });
});
