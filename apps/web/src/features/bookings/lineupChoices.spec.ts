import { describe, it, expect } from 'vitest';
import {
  EMPTY_LINEUP_CHOICES,
  addStandaloneLineup,
  buildLineupsPayload,
  effectivePackageLineup,
  groupLineupChoices,
  groupPlaysLine,
  partsLine,
  removeStandaloneLineup,
  setPackageLineupOverride,
} from './lineupChoices';
import type { LineupTemplate, PackageTemplate } from '@/types/api';

const drinks = { id: 'drinks', label: 'Drinks Reception', defaultLineupTemplateId: 'four' } as PackageTemplate;
const evening = { id: 'evening', label: 'Evening Party', defaultLineupTemplateId: 'four' } as PackageTemplate;
const ceremony = { id: 'ceremony', label: 'Ceremony', defaultLineupTemplateId: null } as PackageTemplate;
const packageTemplates = [drinks, evening, ceremony];

const fourPiece = { id: 'four', label: 'My four-piece', slots: [{ role: 'Sax' }, { role: 'Drums' }] } as LineupTemplate;

describe('effectivePackageLineup', () => {
  it('resolves to the template default when no override is set', () => {
    expect(effectivePackageLineup(EMPTY_LINEUP_CHOICES, 'drinks', packageTemplates)).toBe('four');
  });

  it('resolves to null when the template has no default and no override is set', () => {
    expect(effectivePackageLineup(EMPTY_LINEUP_CHOICES, 'ceremony', packageTemplates)).toBeNull();
  });

  it('resolves to an explicit override, including an explicit "Decide later" (null)', () => {
    const choices = setPackageLineupOverride(EMPTY_LINEUP_CHOICES, 'drinks', null);
    expect(effectivePackageLineup(choices, 'drinks', packageTemplates)).toBeNull();
  });

  it('resolves to a different explicit override', () => {
    const choices = setPackageLineupOverride(EMPTY_LINEUP_CHOICES, 'drinks', 'solo');
    expect(effectivePackageLineup(choices, 'drinks', packageTemplates)).toBe('solo');
  });
});

describe('groupLineupChoices', () => {
  it('groups two selected packages sharing the same default lineup into one group ("same band, both segments")', () => {
    const groups = groupLineupChoices(EMPTY_LINEUP_CHOICES, ['drinks', 'evening'], packageTemplates);
    expect(groups).toEqual([{ lineupTemplateId: 'four', packageTemplateIds: ['drinks', 'evening'] }]);
  });

  it('omits a package resolving to null (no default, no override — the untouched "Decide later" state)', () => {
    const groups = groupLineupChoices(EMPTY_LINEUP_CHOICES, ['ceremony'], packageTemplates);
    expect(groups).toEqual([]);
  });

  // The deselect-safety property: grouping is a pure function of the CURRENTLY selected package
  // ids, never of the override map's own keys — so a stale override for a package the musician
  // has since deselected can never leak an entry into the payload. This is the #988-class
  // silent-drop bug this module exists to make structurally impossible, not merely avoided by
  // remembering to clean up state on deselect.
  it('never includes a package that is not currently selected, even if an override for it still exists', () => {
    const choices = setPackageLineupOverride(EMPTY_LINEUP_CHOICES, 'drinks', 'four');
    // 'drinks' has an override but is NOT passed as selected below (simulating deselection
    // without the container having cleared the override).
    const groups = groupLineupChoices(choices, ['evening'], packageTemplates);
    expect(groups).toEqual([{ lineupTemplateId: 'four', packageTemplateIds: ['evening'] }]);
  });

  it('includes a standalone lineup with no packages (the package-less / additional-band case)', () => {
    const choices = addStandaloneLineup(EMPTY_LINEUP_CHOICES, 'solo');
    const groups = groupLineupChoices(choices, [], packageTemplates);
    expect(groups).toEqual([{ lineupTemplateId: 'solo', packageTemplateIds: [] }]);
  });

  it('merges a standalone declaration with a package pointing at the same lineup into one group', () => {
    const choices = addStandaloneLineup(EMPTY_LINEUP_CHOICES, 'four');
    const groups = groupLineupChoices(choices, ['drinks'], packageTemplates);
    expect(groups).toEqual([{ lineupTemplateId: 'four', packageTemplateIds: ['drinks'] }]);
  });

  it('removeStandaloneLineup drops the standalone-only declaration', () => {
    const added = addStandaloneLineup(EMPTY_LINEUP_CHOICES, 'solo');
    const removed = removeStandaloneLineup(added, 'solo');
    expect(groupLineupChoices(removed, [], packageTemplates)).toEqual([]);
  });
});

// #989's three-state contract (settled by #982) — the third state must not collapse into the
// first, which is exactly the bug class this issue exists to prevent recurring.
describe('buildLineupsPayload', () => {
  it('returns undefined when the control never renders (no lineup templates) — server falls back to template defaults', () => {
    expect(buildLineupsPayload(EMPTY_LINEUP_CHOICES, ['drinks'], packageTemplates, false)).toBeUndefined();
  });

  it('returns an empty array for "Decide later" (nothing chosen) — must not collapse into undefined', () => {
    const choices = setPackageLineupOverride(EMPTY_LINEUP_CHOICES, 'drinks', null);
    expect(buildLineupsPayload(choices, ['drinks'], packageTemplates, true)).toEqual([]);
  });

  it('returns one entry per declared Lineup when something is chosen', () => {
    const result = buildLineupsPayload(EMPTY_LINEUP_CHOICES, ['drinks', 'evening'], packageTemplates, true);
    expect(result).toEqual([{ lineupTemplateId: 'four', packageTemplateIds: ['drinks', 'evening'] }]);
  });
});

describe('groupPlaysLine', () => {
  it('reads "Plays X and Y" for a group with packages', () => {
    const group = { lineupTemplateId: 'four', packageTemplateIds: ['drinks', 'evening'] };
    expect(groupPlaysLine(group, packageTemplates, 2)).toEqual({
      text: 'Plays Drinks Reception and Evening Party',
      warning: false,
    });
  });

  it('warns "Plays nothing yet" for a standalone group when packages exist elsewhere on the booking', () => {
    const group = { lineupTemplateId: 'solo', packageTemplateIds: [] };
    expect(groupPlaysLine(group, packageTemplates, 1)).toEqual({ text: 'Plays nothing yet', warning: true });
  });

  it('reads "Plays the whole gig" for a standalone group on a package-less booking', () => {
    const group = { lineupTemplateId: 'solo', packageTemplateIds: [] };
    expect(groupPlaysLine(group, packageTemplates, 0)).toEqual({ text: 'Plays the whole gig', warning: false });
  });
});

describe('partsLine', () => {
  it('joins slot roles with the dot separator', () => {
    expect(partsLine(fourPiece)).toBe('Sax · Drums');
  });

  it('returns an empty string for a lineup with no slots', () => {
    expect(partsLine({ ...fourPiece, slots: [] })).toBe('');
  });
});
