import type { ReactNode } from 'react';
import { LabelValue } from '@/components/common/LabelValue';
import { cn } from '@/lib/utils';

// #983's resolution — the **part** shape, used for a part and nothing else. Role in a fixed narrow
// left column, then its call time (and its band, only when the booking has more than one), then one
// action. A filled part and an empty one are the SAME row: that is how the vacancy/member symmetry
// is answered — one component used twice, not two blocks made to resemble each other.
//
// This is LabelValue at a narrower column, not a copy of it. `cn` is twMerge, so the grid override
// below replaces the primitive's 140px base cleanly (BandMemberRow overrode the same component the
// same way before #987). 140px leaves too little room inside a card at 375px.
//
// Not SubLabel for the band name: that is a uppercase/tracked `<p>`, and this slot sits inside
// LabelValue's value `<span>`. Inline muted meta, not a heading.

interface PartRowProps {
  role: string;
  /** Derived server-side from the band's segments' earliest set start (#987 AC 5); absent, not zero. */
  callTime: string | null;
  /**
   * The segment (booking-level Package) that produced `callTime` — e.g. "Wedding Ceremony" —
   * derived server-side alongside it (#991 preprod follow-up). Null for a package-less/whole-day
   * segment, in which case the row falls back to the bare time, as before.
   */
  segmentLabel?: string | null;
  /** The band's name — pass only when the booking has more than one (see `shouldNameBand`). */
  bandName?: string;
  /** One action: fill it, or empty it. */
  action?: ReactNode;
  /**
   * Whether this row draws LabelValue's own bottom border. Default `true` — successive rows under
   * a Player divide themselves. `PartsToFillCard` passes `false`: there, a vacant part's row and
   * its attached "fill this part" picker are one unit, so the divider belongs on the unit's own
   * wrapper, below the picker, not between the row and its own picker.
   */
  bordered?: boolean;
}

export function PartRow({ role, callTime, segmentLabel, bandName, action, bordered = true }: PartRowProps) {
  const timeText = [segmentLabel, callTime].filter(Boolean).join(' ') || 'No call time';
  return (
    <LabelValue label={role} className={cn('grid-cols-[84px_1fr] gap-3 py-2', !bordered && 'border-b-0')}>
      {/* items-start, not items-center: the label has no flex wrapper of its own so it top-aligns
          by default — this row must match it, or the two drift apart the moment the value wraps
          onto a second line (the label stays pinned to the top of the now-taller grid row while a
          centered flex line slides down to the middle). */}
      <span className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
        <span className="text-base text-foreground">{timeText}</span>
        {bandName && <span className="text-sm text-muted">{bandName}</span>}
        {action && <span className="ml-auto flex items-center">{action}</span>}
      </span>
    </LabelValue>
  );
}
