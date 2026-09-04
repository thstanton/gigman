import { Check } from 'lucide-react';
import { TogglePill } from '@/components/ui/toggle-pill';
import type { BookingPackageSummary } from '@/types/api';

// #987: choosing which segments a band plays is a multi-select, because a Lineup plays a *set*.
// TogglePill is the app's existing multi-select idiom (there is no Checkbox primitive), so this is
// a layout over it rather than a new control.
//
// Copy note (#983): "parts" may no longer mean segments — the word now belongs to a Chair. Segments
// are named directly rather than given a collective noun, which is why this has no group label of
// its own and the dialogs that host it ask a question instead.

interface SegmentTogglesProps {
  packages: BookingPackageSummary[];
  selected: string[];
  onToggle: (packageId: string) => void;
  disabled?: boolean;
}

export function SegmentToggles({ packages, selected, onToggle, disabled }: SegmentTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {packages.map((pkg) => {
        const active = selected.includes(pkg.id);
        return (
          <TogglePill
            key={pkg.id}
            active={active}
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onToggle(pkg.id)}
          >
            {active && <Check size={12} />}
            {pkg.label}
          </TogglePill>
        );
      })}
    </div>
  );
}
