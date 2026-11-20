// Runtime validation coverage for: OTP route parameter handling.
import { describe, expect, it } from 'vitest';
import { getPhoneNumberFromParams } from './otpParams';

describe('getPhoneNumberFromParams', () => {
  it('returns a single phone number parameter', () => {
    expect(getPhoneNumberFromParams('+84123456789')).toBe('+84123456789');
  });

  it('uses the first value when the parameter is repeated', () => {
    expect(getPhoneNumberFromParams(['+84123456789', '+84987654321'])).toBe('+84123456789');
  });

  it('returns an empty string when the parameter is missing', () => {
    expect(getPhoneNumberFromParams(undefined)).toBe('');
  });
});
