import type { BookingBandChair, BookingLineup, BookingPackageSummary } from '@/types/api';

// #987 / #983's resolution. The derivations the three Band cards share, declared once so the
// "one shape per object" rule cannot drift between the Lineups card, the Players card and Parts to
// fill — all three render the same part row from the same facts.
//
// Vocabulary note (#983): **"part" is the user-facing word**, `Chair` stays the model word. The
// API, the DTOs and these types are untouched; only the copy speaks "part".

/** An unnamed Lineup — a musician with no lineup templates who added one part at a time (#884). */
export const UNNAMED_LINEUP = 'Band';

export function lineupName(lineup: BookingLineup): string {
  return lineup.label ?? UNNAMED_LINEUP;
}

/**
 * #987 retired `chairPackageId`, which returned `packageIds[0]`. That was correct only while a
 * Lineup played at most one segment; the moment one plays two it silently reported the first and
 * decided, wrongly, which segment a part rendered under in the Itinerary (#983 flagged it).
 * A part plays every segment its band plays.
 */
export function chairPackageIds(chair: BookingBandChair, lineups: BookingLineup[]): string[] {
  return lineups.find((l) => l.id === chair.lineupId)?.packageIds ?? [];
}

/** Segment labels for a Lineup, in the booking's own package order rather than link order. */
export function lineupSegmentLabels(lineup: BookingLineup, packages: BookingPackageSummary[]): string[] {
  return packages.filter((p) => lineup.packageIds.includes(p.id)).map((p) => p.label);
}

/** "Drinks Reception", "Drinks Reception and Evening Party", "Drinks, Evening and Late Set". */
export function joinSegments(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export interface PlaysLine {
  text: string;
  /** #983 story state 7: a Lineup on a packaged booking that plays nothing reads in the warning tone. */
  warning: boolean;
}

/**
 * What a band plays, in one line. The empty link set is two different facts and the booking tells
 * them apart (ADR-0081 §4) — on a booking with no packages there is one bucket and the band plays
 * all of it; on a booking with packages it is a band parked with nothing to play yet.
 */
export function playsLine(
  lineup: BookingLineup,
  packages: BookingPackageSummary[],
): PlaysLine {
  const labels = lineupSegmentLabels(lineup, packages);
  if (labels.length) {
    const segments = joinSegments(labels);
    return { text: `Plays ${segments}`, warning: false };
  }
  return packages.length
    ? { text: 'Plays nothing yet', warning: true }
    : { text: 'Plays the whole gig', warning: false };
}

/** A band's parts, in seat order. `order` is per-Lineup (ADR-0081), never booking-wide. */
export function partsOf(lineupId: string, chairs: BookingBandChair[]): BookingBandChair[] {
  return chairs.filter((c) => c.lineupId === lineupId).sort((a, b) => a.order - b.order);
}

/** "7 parts · 2 still to fill" / "4 parts · all filled" — the reason to look at the Lineups card. */
export function partCountLine(parts: BookingBandChair[]): string {
  const vacant = parts.filter((c) => c.memberId === null).length;
  const noun = parts.length === 1 ? 'part' : 'parts';
  const fill = vacant ? `${vacant} still to fill` : 'all filled';
  return `${parts.length} ${noun} · ${fill}`;
}

/**
 * #983's suppression rule, in one place: a part row names its band **only** when the booking has
 * more than one. Four of the six story scenarios have exactly one, and showing the name there puts
 * it on the card title AND on every row beneath it — which is most of what read as blurry.
 * The same rule governs BandCard's vacancy badges, so the musician learns it once.
 */
export function shouldNameBand(lineups: BookingLineup[]): boolean {
  return lineups.length > 1;
}

/**
 * Who renders as a player: anyone holding at least one part, **or** the musician themself.
 *
 * `Players` is purely derived (#983) — someone leaves by coming out of every part, and their row
 * goes with the last one. `isSelf` is the deliberate exception: ADR-0072 §3 marks the musician on
 * the booking whether or not they fill a part, and `BandCard` has shown that all along.
 *
 * Declared here because BOTH surfaces must obey it. When only the sheet filtered, emptying
 * someone's last part made them vanish from the sheet while persisting on the Info tab as an
 * unlabelled chip — and with no per-person remove there was then no way to clear them anywhere.
 */
export function rendersAsPlayer(member: { id: string; isSelf: boolean }, chairs: BookingBandChair[]): boolean {
  return member.isSelf || chairs.some((c) => c.memberId === member.id);
}

/**
 * The Lineups an apply targeting `packageIds` would sweep away entirely — mirrors the server's
 * `displaceSegments`: a band is displaced when every segment it played was targeted, and on a
 * booking with no packages the single link-less bucket is what an empty target displaces.
 *
 * The apply path genuinely deletes chairs, members' seats and their confirmations, so the musician
 * has to be told before it happens. Journey ④ — which touches links only and destroys nothing —
 * already warns; without this, the *safe* operation warned and the destructive one did not.
 */
export function lineupsDisplacedBy(
  lineups: BookingLineup[],
  packages: BookingPackageSummary[],
  packageIds: string[],
): BookingLineup[] {
  if (!packageIds.length) {
    return packages.length ? [] : lineups.filter((l) => l.packageIds.length === 0);
  }
  return lineups.filter(
    (l) => l.packageIds.length > 0 && l.packageIds.every((id) => packageIds.includes(id)),
  );
}
