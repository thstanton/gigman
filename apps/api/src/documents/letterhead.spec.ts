process.env.ENCRYPTION_KEY = 'a'.repeat(64);

import { encrypt } from '../common/crypto';
import { buildLetterhead, formatAddress } from './letterhead';

const fullProfile = {
  addressLine1: '12 Example Street',
  addressLine2: 'Suite 4',
  city: 'London',
  postcode: 'SW1A 1AA',
  vatNumber: 'GB123456789',
  vatRate: 20,
  bankDetails: encrypt('sort: 12-34-56, acc: 12345678'),
};

describe('buildLetterhead', () => {
  it('carries no field beyond the permitted set', () => {
    // A profile field added later (e.g. a Travel Base column) must not silently reach an invoice
    // just by existing on UserProfile — it can only join this list by deliberately widening it.
    const letterhead = buildLetterhead(fullProfile);
    expect(Object.keys(letterhead).sort((a, b) => a.localeCompare(b))).toEqual(['address', 'bankDetails', 'vatNumber', 'vatRate']);
  });

  it('decrypts the bank details', () => {
    const letterhead = buildLetterhead(fullProfile);
    expect(letterhead.bankDetails).toBe('sort: 12-34-56, acc: 12345678');
  });

  it('formats the business address from address lines, city and postcode', () => {
    const letterhead = buildLetterhead(fullProfile);
    expect(letterhead.address).toBe('12 Example Street\nSuite 4\nLondon\nSW1A 1AA');
  });

  it('carries the VAT number and defaults the rate to 20 when unset on the profile', () => {
    const letterhead = buildLetterhead({ ...fullProfile, vatRate: undefined as unknown as number });
    expect(letterhead.vatNumber).toBe('GB123456789');
    expect(letterhead.vatRate).toBe(20);
  });

  it('omits VAT number and rate when the profile has no VAT number', () => {
    const letterhead = buildLetterhead({ ...fullProfile, vatNumber: null });
    expect(letterhead.vatNumber).toBeNull();
    expect(letterhead.vatRate).toBeNull();
  });

  it('returns null fields for a missing profile', () => {
    const letterhead = buildLetterhead(null);
    expect(letterhead).toEqual({ address: null, vatNumber: null, vatRate: null, bankDetails: null });
  });
});

describe('formatAddress', () => {
  it('reads only the business address fields, skipping blank lines', () => {
    expect(formatAddress({ addressLine1: '1 Road', addressLine2: null, city: 'Town', postcode: 'AB1 2CD' })).toBe(
      '1 Road\nTown\nAB1 2CD',
    );
  });

  it('returns null when every address field is blank', () => {
    expect(formatAddress({ addressLine1: null, addressLine2: null, city: null, postcode: null })).toBeNull();
  });

  it('returns null for a missing profile', () => {
    expect(formatAddress(null)).toBeNull();
  });
});
