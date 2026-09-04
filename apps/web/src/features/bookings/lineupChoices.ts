import { segmentsLine, type PlaysLine } from './bandParts';
import type { BookingLineupSelectionInput, LineupTemplate, PackageTemplate } from '@/types/api';

// #989: the musician's declared lineup choices at create/Builder time, before anything is
// persisted — the create-time counterpart to bandParts.ts's persisted-Lineup derivations. Two
// ways to set one fact, matching #982's resolution: a per-package "Who plays this?" select, and a
// lineup pill toggled on standalone (the package-less / "additional band" case). No precedence
// rule between them (#982 leaves this open) — they are unified by grouping on lineupTemplateId.

export interface LineupChoices {
  /**
   * Explicit overrides only, keyed by packageTemplateId — set the moment the musician changes a
   * package's select away from its template default (to another lineup, or to "Decide later" =
   * null). An ABSENT key means "still the default", resolved at build time in
   * `effectivePackageLineup` — so selecting a package needs no seeding, and re-selecting one after
   * deselecting it correctly shows the default again unless the musician touches it again.
   */
  overrides: Record<string, string | null>;
  /** Lineup templates declared standalone — a pill toggled on with no package pointing to it yet. */
  standalone: string[];
}

export const EMPTY_LINEUP_CHOICES: LineupChoices = { overrides: {}, standalone: [] };

export function setPackageLineupOverride(
  choices: LineupChoices,
  packageTemplateId: string,
  lineupTemplateId: string | null,
): LineupChoices {
  return { ...choices, overrides: { ...choices.overrides, [packageTemplateId]: lineupTemplateId } };
}

export function addStandaloneLineup(choices: LineupChoices, lineupTemplateId: string): LineupChoices {
  if (choices.standalone.includes(lineupTemplateId)) return choices;
  return { ...choices, standalone: [...choices.standalone, lineupTemplateId] };
}

export function removeStandaloneLineup(choices: LineupChoices, lineupTemplateId: string): LineupChoices {
  return { ...choices, standalone: choices.standalone.filter((id) => id !== lineupTemplateId) };
}

/**
 * The lineup currently in effect for a selected package template: the musician's explicit
 * override if they've set one (including an explicit "Decide later" = null), else the template's
 * own default. Only meaningful for a package that is actually selected — grouping below only ever
 * calls this for ids in `selectedPackageTemplateIds`, which is what makes deselecting a package
 * safe without needing to clean up a stale override (#988-class silent-drop risk, closed by
 * construction: a deselected package can never contribute to a group, override or not).
 */
export function effectivePackageLineup(
  choices: LineupChoices,
  packageTemplateId: string,
  packageTemplates: PackageTemplate[],
): string | null {
  if (packageTemplateId in choices.overrides) return choices.overrides[packageTemplateId];
  return packageTemplates.find((t) => t.id === packageTemplateId)?.defaultLineupTemplateId ?? null;
}

export interface LineupGroup {
  lineupTemplateId: string;
  packageTemplateIds: string[];
}

/**
 * Groups the musician's choices by lineup — "same band, both segments" stated once on the wire
 * (ADR-0081 §4's argument style), rather than the server re-deriving the dedupe. Order: first
 * appearance across selected packages (in selection order), then standalone-only additions.
 */
export function groupLineupChoices(
  choices: LineupChoices,
  selectedPackageTemplateIds: string[],
  packageTemplates: PackageTemplate[],
): LineupGroup[] {
  const order: string[] = [];
  const packagesByLineup = new Map<string, string[]>();

  for (const packageTemplateId of selectedPackageTemplateIds) {
    const lineupTemplateId = effectivePackageLineup(choices, packageTemplateId, packageTemplates);
    if (!lineupTemplateId) continue;
    if (!packagesByLineup.has(lineupTemplateId)) {
      packagesByLineup.set(lineupTemplateId, []);
      order.push(lineupTemplateId);
    }
    packagesByLineup.get(lineupTemplateId)!.push(packageTemplateId);
  }

  for (const lineupTemplateId of choices.standalone) {
    if (!packagesByLineup.has(lineupTemplateId)) {
      packagesByLineup.set(lineupTemplateId, []);
      order.push(lineupTemplateId);
    }
  }

  return order.map((lineupTemplateId) => ({
    lineupTemplateId,
    packageTemplateIds: packagesByLineup.get(lineupTemplateId)!,
  }));
}

/**
 * The wire payload for `CreateBookingInput.lineups` (#989's three-state contract, settled by
 * #982). `undefined` when the control never rendered (no lineup templates) so the server falls
 * back to each package template's own default (#988) — otherwise always an array, even when
 * empty ("Decide later", which must NOT collapse into the omitted state).
 */
export function buildLineupsPayload(
  choices: LineupChoices,
  selectedPackageTemplateIds: string[],
  packageTemplates: PackageTemplate[],
  hasLineupTemplates: boolean,
): BookingLineupSelectionInput[] | undefined {
  if (!hasLineupTemplates) return undefined;
  return groupLineupChoices(choices, selectedPackageTemplateIds, packageTemplates).map((g) => ({
    lineupTemplateId: g.lineupTemplateId,
    packageTemplateIds: g.packageTemplateIds,
  }));
}

/** "Plays Drinks Reception and Evening Party." for a group's Lineup block. See `bandParts.segmentsLine`. */
export function groupPlaysLine(
  group: LineupGroup,
  packageTemplates: PackageTemplate[],
  totalPackagesSelected: number,
): PlaysLine {
  const labels = group.packageTemplateIds
    .map((id) => packageTemplates.find((t) => t.id === id)?.label)
    .filter((l): l is string => l != null);
  return segmentsLine(labels, totalPackagesSelected > 0);
}

/** "Vocals · Guitar · Bass · Drums" — the roles line for a lineup template's Parts preview. */
export function partsLine(lineupTemplate: LineupTemplate): string {
  return lineupTemplate.slots.map((s) => s.role).join(' · ');
}
