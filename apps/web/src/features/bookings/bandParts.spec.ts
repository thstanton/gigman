import { describe, it, expect } from 'vitest';
import { joinSegments, playsLine, segmentsLine } from './bandParts';
import type { BookingLineup, BookingPackageSummary } from '@/types/api';

describe('joinSegments', () => {
  it('returns the single label unchanged', () => {
    expect(joinSegments(['Drinks Reception'])).toBe('Drinks Reception');
  });

  it('joins two labels with "and"', () => {
    expect(joinSegments(['Drinks Reception', 'Evening Party'])).toBe('Drinks Reception and Evening Party');
  });

  it('joins three or more labels with commas and a trailing "and"', () => {
    expect(joinSegments(['Drinks', 'Evening', 'Late Set'])).toBe('Drinks, Evening and Late Set');
  });

  it('returns an empty string for an empty list', () => {
    expect(joinSegments([])).toBe('');
  });
});

// #989: this wording is shared with the create-time musician's declared choice (lineupChoices.ts)
// against PackageTemplate labels, not just persisted Lineups — the one-declaration-per-vocabulary
// rule this repo follows after booking status was once declared 13 times.
describe('segmentsLine', () => {
  it('reads "Plays X and Y" for a non-empty label set, no warning', () => {
    expect(segmentsLine(['Drinks Reception', 'Evening Party'], true)).toEqual({
      text: 'Plays Drinks Reception and Evening Party',
      warning: false,
    });
  });

  it('reads "Plays nothing yet" with a warning when packages exist but none are linked', () => {
    expect(segmentsLine([], true)).toEqual({ text: 'Plays nothing yet', warning: true });
  });

  it('reads "Plays the whole gig" with no warning when there are no packages at all', () => {
    expect(segmentsLine([], false)).toEqual({ text: 'Plays the whole gig', warning: false });
  });
});

describe('playsLine', () => {
  const packages: BookingPackageSummary[] = [
    { id: 'p1', label: 'Drinks Reception' } as BookingPackageSummary,
    { id: 'p2', label: 'Evening Party' } as BookingPackageSummary,
  ];

  it('delegates to segmentsLine using this Lineup\'s own segment labels', () => {
    const lineup = { packageIds: ['p1', 'p2'] } as BookingLineup;
    expect(playsLine(lineup, packages)).toEqual({ text: 'Plays Drinks Reception and Evening Party', warning: false });
  });

  it('warns when the booking has packages but this Lineup plays none of them', () => {
    const lineup = { packageIds: [] } as unknown as BookingLineup;
    expect(playsLine(lineup, packages)).toEqual({ text: 'Plays nothing yet', warning: true });
  });

  it('reads "Plays the whole gig" on a package-less booking', () => {
    const lineup = { packageIds: [] } as unknown as BookingLineup;
    expect(playsLine(lineup, [])).toEqual({ text: 'Plays the whole gig', warning: false });
  });
});
