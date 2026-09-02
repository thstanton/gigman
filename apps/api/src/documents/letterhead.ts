import { decrypt } from '../common/crypto';

// The allow-list of UserProfile fields a client-facing document may print (ADR-0082). Business
// Address and Travel Base are two different concepts on the same model — a future Travel Base
// field must be deliberately added here before it can reach an invoice; it cannot arrive just by
// being added to UserProfile. See #1015.
export interface Letterhead {
  address: string | null;
  vatNumber: string | null;
  vatRate: number | null;
  bankDetails: string | null;
}

type LetterheadProfile = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  vatNumber: string | null;
  vatRate: number;
  bankDetails: string | null;
} | null;

export function formatAddress(
  profile: {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postcode: string | null;
  } | null,
): string | null {
  if (!profile) return null;
  return [profile.addressLine1, profile.addressLine2, profile.city, profile.postcode].filter(Boolean).join('\n') || null;
}

export function buildLetterhead(profile: LetterheadProfile): Letterhead {
  return {
    address: formatAddress(profile),
    vatNumber: profile?.vatNumber ?? null,
    vatRate: profile?.vatNumber ? (profile.vatRate ?? 20) : null,
    bankDetails: profile?.bankDetails ? decrypt(profile.bankDetails) : null,
  };
}
