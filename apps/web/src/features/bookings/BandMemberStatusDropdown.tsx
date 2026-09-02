import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BAND_MEMBER_STATUS_LABELS, BAND_MEMBER_STATUS_ORDER, BAND_MEMBER_STATUS_TOKENS } from '@/lib/constants';
import type { BookingBandMemberStatus } from '@/types/api';

// #983: **the pill IS the dropdown.** The predecessor rendered `StatusPill` and then a `<Select>`
// beside it, so the status word appeared twice — the first thing called out in the prototype. This
// is BookingStatusDropdown's trigger (bordered-left pill + a small chevron) opening a list of the
// same pills with a tick against the current one, so the two status controls in the app match.
//
// Colours come from the one BAND_MEMBER_STATUSES table (CLAUDE.md's one-declaration rule) — the
// classes are literal strings in that table, never interpolated, so Tailwind's scanner sees them.

const pillClasses = (status: BookingBandMemberStatus) => {
  const { tint, text, borderL } = BAND_MEMBER_STATUS_TOKENS[status];
  return cn(tint, text, borderL);
};

const PILL = 'inline-flex items-center border-l-[3px] pl-2 pr-2.5 py-0.5 text-xs font-medium';

interface BandMemberStatusDropdownProps {
  status: BookingBandMemberStatus;
  onChange: (status: BookingBandMemberStatus) => void;
  isPending: boolean;
  /** Names the person, so a sheet full of these has distinguishable accessible names. */
  memberName: string;
}

export function BandMemberStatusDropdown({ status, onChange, isPending, memberName }: BandMemberStatusDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Status for ${memberName}`}
          disabled={isPending}
          className={cn(PILL, 'gap-1 cursor-pointer transition-opacity', pillClasses(status), isPending && 'opacity-50')}
        >
          {BAND_MEMBER_STATUS_LABELS[status]}
          <ChevronDown size={10} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {BAND_MEMBER_STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onChange(s)} className="gap-2">
            <span className={cn(PILL, pillClasses(s))}>{BAND_MEMBER_STATUS_LABELS[s]}</span>
            {s === status && <Check size={12} className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
