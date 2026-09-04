import {
  CalendarClock,
  FileText,
  ListOrdered,
  MapPin,
  Mic2,
  Music,
  Package,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { SpineId } from '@/features/bookings/builderCompleteness';

// The Booking Builder's spine (PRD #511 Module C): the fixed, ordered list of
// concerns the page, the completeness rail, the mobile stepper and the
// exit-backstop dialog all derive from. Declared once so section composition
// can be driven from it rather than hand-written per consumer.
//
// Band sits beside Venue and Templates (#991, ADR-0081 §8): "what is played
// and where" is what seating a player is a fact about.
export const SPINE: Array<{ id: SpineId; label: string; Icon: LucideIcon }> = [
  { id: 'overview',   label: 'Overview',          Icon: CalendarClock },
  { id: 'people',     label: 'People',             Icon: Users },
  { id: 'venue',      label: 'Venue',              Icon: MapPin },
  { id: 'templates',  label: 'Package Templates',  Icon: Package },
  { id: 'band',       label: 'Band',               Icon: Mic2 },
  { id: 'itinerary',  label: 'Itinerary',          Icon: ListOrdered },
  { id: 'details',    label: 'Details',            Icon: FileText },
  { id: 'music',      label: 'Music',              Icon: Music },
  { id: 'notes',      label: 'Notes',              Icon: StickyNote },
];

// Stable element-id list for the scroll-spy (module-level so the observer isn't
// rebuilt each render). Mirrors the BuilderSection `id={`builder-${id}`}`. Left
// unfiltered even with Band flagged off: useScrollSpy drops any id with no
// matching DOM element, so an unrendered section's id is a harmless no-op.
export const SECTION_DOM_IDS = SPINE.map(({ id }) => `builder-${id}`);

