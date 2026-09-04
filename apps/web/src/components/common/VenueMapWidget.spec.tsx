import { describe, it, expect } from 'vitest';
import {
  resolveTravelTimeStatus,
  travelTimeRefreshVisible,
  resolveMapStatus,
} from './VenueMapWidget';

describe('resolveTravelTimeStatus', () => {
  const travelTime = { minutes: 25, distanceMetres: 12300 };

  it('is loading whenever a calculation is in flight (precedence over everything)', () => {
    expect(
      resolveTravelTimeStatus({ isLoadingTravelTime: true, travelTime, travelBaseMissing: true }),
    ).toEqual({ kind: 'loading' });
  });

  it('is known with a formatted label when a travel time is present', () => {
    expect(
      resolveTravelTimeStatus({ isLoadingTravelTime: false, travelTime, travelBaseMissing: false }),
    ).toEqual({ kind: 'known', label: '~25 min · 12.3 km driving' });
  });

  it('prompts to add a Travel Base when one is missing and no time is known', () => {
    expect(
      resolveTravelTimeStatus({ isLoadingTravelTime: false, travelTime: null, travelBaseMissing: true }),
    ).toEqual({ kind: 'add-travel-base' });
  });

  it('is unavailable when no time is known and the Travel Base is present', () => {
    expect(
      resolveTravelTimeStatus({ isLoadingTravelTime: false, travelTime: null, travelBaseMissing: false }),
    ).toEqual({ kind: 'unavailable' });
    // undefined travelTime behaves the same as null
    expect(
      resolveTravelTimeStatus({ isLoadingTravelTime: false, travelTime: undefined, travelBaseMissing: false }),
    ).toEqual({ kind: 'unavailable' });
  });
});

describe('travelTimeRefreshVisible', () => {
  it('shows the refresh button only for known/unavailable, hides it while loading or prompting for a Travel Base', () => {
    expect(travelTimeRefreshVisible({ kind: 'known', label: 'x' })).toBe(true);
    expect(travelTimeRefreshVisible({ kind: 'unavailable' })).toBe(true);
    expect(travelTimeRefreshVisible({ kind: 'loading' })).toBe(false);
    expect(travelTimeRefreshVisible({ kind: 'add-travel-base' })).toBe(false);
  });
});

describe('resolveMapStatus', () => {
  it('is no-coords when the venue is not geocoded (precedence over a map failure)', () => {
    expect(resolveMapStatus({ hasCoords: false, mapFailed: false })).toBe('no-coords');
    expect(resolveMapStatus({ hasCoords: false, mapFailed: true })).toBe('no-coords');
  });

  it('is failed when geocoded but the map could not load', () => {
    expect(resolveMapStatus({ hasCoords: true, mapFailed: true })).toBe('failed');
  });

  it('is map when geocoded and the map loaded', () => {
    expect(resolveMapStatus({ hasCoords: true, mapFailed: false })).toBe('map');
  });
});
