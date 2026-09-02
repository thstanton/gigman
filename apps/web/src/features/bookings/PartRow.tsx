import type { ReactNode } from 'react';
import { LabelValue } from '@/components/common/LabelValue';

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
  /** The band's name — pass only when the booking has more than one (see `shouldNameBand`). */
  bandName?: string;
  /** One action: fill it, or empty it. */
  action?: ReactNode;
}

export function PartRow({ role, callTime, bandName, action }: PartRowProps) {
  return (
    <LabelValue label={role} className="grid-cols-[84px_1fr] gap-3 py-2">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-base text-foreground">{callTime ?? 'No call time'}</span>
        {bandName && <span className="text-sm text-muted">{bandName}</span>}
        {action && <span className="ml-auto flex items-center">{action}</span>}
      </span>
    </LabelValue>
  );
}
