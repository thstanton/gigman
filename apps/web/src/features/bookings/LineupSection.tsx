import { useState } from 'react';
import { Check, Eye, Plus, Users } from 'lucide-react';
import { GhostButton } from '@/components/common/GhostButton';
import { cn } from '@/lib/utils';
import { groupLineupChoices, groupPlaysLine, partsLine, type LineupChoices } from './lineupChoices';
import type { LineupTemplate, PackageTemplate } from '@/types/api';

// #989 (design #982, variant D): the sibling section to PackagePicker's Package Templates, same
// shape — chosen lineups lift out into blocks (name, Parts, "Plays X and Y"), the rest stay as
// pills with an eye showing their Parts, then "+ New lineup". States a lineup is "on the day"
// whether that came from a per-package "Who plays this?" select or a pill toggled on here — the
// two are unified by lineupChoices.ts's grouping, which is why this section is also the only home
// for the package-less musician ("declared with no segments" — the whole-gig and additional-band
// cases). ADR-0081 §5 constraint 3: absent entirely for a musician with no lineup templates, so
// their form is byte-for-byte what it was before #989 (the Story 39 guard).
//
// A block reachable ONLY via a package select (never toggled on here directly) has no click-to-
// remove header — clicking it would appear to do nothing, since the package select is what's
// actually authoritative for it (#982 leaves the two controls' precedence deliberately unranked).
// It reads "Set by a package above" instead of offering a dead-end control.

interface LineupSectionProps {
  /** The musician's lineup template library. Empty — this section renders nothing at all. */
  lineupTemplates: LineupTemplate[];
  choices: LineupChoices;
  /** Toggles a lineup template on/off the standalone declaration (a package-derived-only
   *  block has no toggle at all — see the file header). */
  onToggleLineup: (lineupTemplateId: string) => void;
  /** The packages currently selected (create) / staged (Builder) — for grouping. */
  selectedPackageTemplateIds: string[];
  packageTemplates: PackageTemplate[];
  /** Opens the shell's lineup-template drawer. Omitted — no create affordance, mirroring
   *  PackagePicker's onCreateTemplate contract (this component owns no mutation, no fetch). */
  onCreateLineup?: () => void;
}

export function LineupSection({
  lineupTemplates,
  choices,
  onToggleLineup,
  selectedPackageTemplateIds,
  packageTemplates,
  onCreateLineup,
}: LineupSectionProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (lineupTemplates.length === 0) return null;

  const groups = groupLineupChoices(choices, selectedPackageTemplateIds, packageTemplates);
  const activeIds = new Set(groups.map((g) => g.lineupTemplateId));
  const pillTemplates = lineupTemplates.filter((lt) => !activeIds.has(lt.id));

  function block(group: (typeof groups)[number]) {
    const lineupTemplate = lineupTemplates.find((lt) => lt.id === group.lineupTemplateId);
    if (!lineupTemplate) return null;
    const removable = choices.standalone.includes(group.lineupTemplateId);
    const plays = groupPlaysLine(group, packageTemplates, selectedPackageTemplateIds.length);
    return (
      <div key={group.lineupTemplateId} className="space-y-1.5 rounded-lg border border-primary bg-primary/5 p-3">
        {removable ? (
          <button
            type="button"
            onClick={() => onToggleLineup(group.lineupTemplateId)}
            aria-pressed
            className="flex items-center gap-1.5 text-left text-sm font-medium text-foreground transition-colors hover:opacity-80"
          >
            <Users size={14} aria-hidden="true" />
            {lineupTemplate.label}
            <Check size={12} className="text-primary" aria-hidden="true" />
          </button>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Users size={14} aria-hidden="true" />
            {lineupTemplate.label}
          </p>
        )}
        <p className="text-sm text-muted">{partsLine(lineupTemplate)}</p>
        <p className={cn('text-sm', plays.warning ? 'text-status-cancelled' : 'text-muted')}>{plays.text}</p>
        {!removable && <p className="text-xs text-muted">Set by a package above.</p>}
      </div>
    );
  }

  function pill(lt: LineupTemplate) {
    const open = previewId === lt.id;
    return (
      <div key={lt.id} className="space-y-1.5">
        <div className="inline-flex items-center rounded-full border border-border text-sm transition-colors">
          <button
            type="button"
            onClick={() => onToggleLineup(lt.id)}
            aria-pressed={false}
            className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1.5 transition-colors hover:opacity-80"
          >
            <Users size={14} aria-hidden="true" />
            {lt.label}
          </button>
          <button
            type="button"
            aria-label={`${open ? 'Hide' : 'Preview'} ${lt.label}`}
            aria-expanded={open}
            onClick={() => setPreviewId(open ? null : lt.id)}
            className="border-l border-border px-2 py-1.5 text-muted transition-colors hover:text-foreground"
          >
            <Eye size={13} aria-hidden="true" />
          </button>
        </div>
        {open && (
          <div className="w-72 max-w-full rounded-lg border border-border bg-background p-3 text-sm">
            <p className="mb-1 font-medium text-foreground">Parts</p>
            <p className="text-muted">{partsLine(lt)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    // Owns its own section chrome (mirroring BookingFormFields' Package Templates section)
    // rather than relying on a container-owned wrapper — the whole section, heading included,
    // must vanish when there are no lineup templates (constraint 3 / Story 39 guard above), and
    // the early return above is only reachable at all if this component controls its own wrapper.
    <section>
      <h2 className="mb-3 text-base font-semibold text-foreground">Lineup</h2>
      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        {groups.length > 0 && <div className="space-y-3">{groups.map(block)}</div>}
        {pillTemplates.length > 0 && (
          <div className="flex flex-wrap items-start gap-2">{pillTemplates.map(pill)}</div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {onCreateLineup && (
            <GhostButton variant="primary" icon={<Plus size={14} aria-hidden="true" />} onClick={onCreateLineup}>
              New lineup
            </GhostButton>
          )}
          {groups.length === 0 && (
            <p className="text-sm text-muted">Decide later — no lineup is applied until you choose one.</p>
          )}
        </div>
      </div>
    </section>
  );
}
