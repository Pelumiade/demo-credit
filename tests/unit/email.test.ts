import { isValidEmailFormat, normalizeEmail } from '../../src/utils/email';

describe('email utils', () => {
  it('normalizes email', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });

  it('rejects random strings', () => {
    expect(isValidEmailFormat('not-an-email')).toBe(false);
    expect(isValidEmailFormat('missing-at-sign')).toBe(false);
  });

  it('rejects addresses without a real domain', () => {
    expect(isValidEmailFormat('a@b')).toBe(false);
  });

  it('accepts typical addresses', () => {
    expect(isValidEmailFormat('ada@test.com')).toBe(true);
    expect(isValidEmailFormat('user.name+tag@mail.example.co.uk')).toBe(true);
  });
});
