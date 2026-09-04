import { useState } from 'react';
import { Check, Eye, Music, Clock } from 'lucide-react';
import { PACKAGE_ICON_MAP } from '@/lib/constants';
import { PackageMusicSummary } from '@/features/packages/PackageMusicSummary';
import { FormField } from '@/components/common/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EMPTY_LINEUP_CHOICES, effectivePackageLineup, type LineupChoices } from './lineupChoices';
import type { LineupTemplate, PackageTemplate } from '@/types/api';

// PRD #511 Module B / ADR-0053 / #546 — the shared package-template picker core. One controlled
// presentational component used by two surfaces (the New Booking form and the Builder's Package
// Templates step), so they look and behave the same. It owns no mutation and no fetch: templates
// + the current selection come in, a toggle goes out. Event-type-matching templates lead; the
// rest collapse under "Other". #989 (design #982, variant D): a selected template leaves the chip
// row and becomes a block — sets, special requests and genres always shown, plus (only when the
// musician has lineup templates, ADR-0081 §5 constraint 3) a "Who plays this?" select beneath a
// ↳. An unselected template stays a chip with the on-demand eye preview, unchanged.
//
// Replaces the create form's bespoke FormatSelector. NOT to be confused with the apply-one
// `TemplatePicker` in ItineraryFields, which the Itinerary's in-canvas add still uses (see #550).
// #989 considered renaming this PackagePicker -> TemplatePicker per #982's resolution but found
// that name already taken by ItineraryFields' component — see #989's own naming-collision comment;
// left for a human naming call rather than decided in this diff.

function PackageIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  const Icon = PACKAGE_ICON_MAP[icon] ?? Music;
  return <Icon size={size} />;
}

function durationLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function totalDuration(t: PackageTemplate): number {
  return t.slots.reduce((sum, s) => sum + s.duration, 0);
}

// The preview body: what applying this template gives you. Sets always; the music-form
// contribution only when the song-request form feature is on (showMusic). Shared by the
// unselected chip's on-demand eye preview and the selected block, which shows it unconditionally
// ("the block is the expanded chip, so nothing is lost by selecting" — #982's resolution).
function TemplatePreview({ template, showMusic }: { template: PackageTemplate; showMusic: boolean }) {
  const genres = template.defaultGenreSelection;
  const moments = template.keyMoments;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="mb-1 font-medium text-foreground">
          Sets ({template.slots.length} · {durationLabel(totalDuration(template))})
        </p>
        <ul className="space-y-1">
          {template.slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-muted">
              <span className="flex items-center gap-1.5">
                <Clock size={12} aria-hidden="true" />
                {s.label || 'Set'}
              </span>
              <span>{durationLabel(s.duration)}</span>
            </li>
          ))}
        </ul>
      </div>

      {showMusic && <PackageMusicSummary genres={genres} moments={moments} />}
    </div>
  );
}

// #989: sentinel item value — Radix Select rejects an empty-string item value, and "Decide later"
// must be a real selectable option (not the absence of one) so it reads as a deliberate choice.
const DECIDE_LATER = '__decide_later__';

function LineupSelect({
  value,
  lineupTemplates,
  onChange,
}: {
  value: string | null;
  lineupTemplates: LineupTemplate[];
  onChange: (lineupTemplateId: string | null) => void;
}) {
  return (
    <Select value={value ?? DECIDE_LATER} onValueChange={(v) => onChange(v === DECIDE_LATER ? null : v)}>
      <SelectTrigger aria-label="Who plays this?">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DECIDE_LATER}>Decide later</SelectItem>
        {lineupTemplates.map((lt) => (
          <SelectItem key={lt.id} value={lt.id}>{lt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface PackagePickerProps {
  templates: PackageTemplate[];
  templatesLoading?: boolean;
  /** Booking event type — matching templates lead, others collapse under "Other packages". */
  eventType: string;
  /** Currently-selected (create) / staged (Builder) template ids. */
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Show the music-form contribution in previews (songRequestFormEnabled). */
  showMusic: boolean;
  /** #989: the musician's lineup template library. Empty/omitted — the picker renders exactly
   *  what it did before #989: no select on any block (ADR-0081 §5 constraint 3, Story 39 guard). */
  lineupTemplates?: LineupTemplate[];
  lineupChoices?: LineupChoices;
  onPackageLineupChange?: (packageTemplateId: string, lineupTemplateId: string | null) => void;
}

export function PackagePicker({
  templates,
  templatesLoading = false,
  eventType,
  selectedIds,
  onToggle,
  showMusic,
  lineupTemplates = [],
  lineupChoices = EMPTY_LINEUP_CHOICES,
  onPackageLineupChange,
}: PackagePickerProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);

  // Provenance is severed (ADR-0046): all enabled templates are offered; those matching the
  // event type lead. Grouping applies only to the unselected remainder — a selected template is
  // always a block regardless of category, so there is no "force this group open" special case.
  const enabled = templates.filter((t) => t.enabled);
  const selected = enabled.filter((t) => selectedIds.includes(t.id));
  const unselected = enabled.filter((t) => !selectedIds.includes(t.id));
  const matching = unselected.filter((t) => t.category === eventType);
  const other = unselected.filter((t) => t.category !== eventType);

  function block(t: PackageTemplate) {
    return (
      <div key={t.id} className="space-y-3 rounded-lg border border-primary bg-primary/5 p-3">
        <button
          type="button"
          onClick={() => onToggle(t.id)}
          aria-pressed
          className="flex items-center gap-1.5 text-left text-sm font-medium text-foreground transition-colors hover:opacity-80"
        >
          <PackageIcon icon={t.icon} />
          {t.label}
          <Check size={12} className="text-primary" aria-hidden="true" />
        </button>
        <TemplatePreview template={t} showMusic={showMusic} />
        {lineupTemplates.length > 0 && (
          <div className="flex items-start gap-2 pt-1">
            <span className="pt-2 text-muted" aria-hidden="true">↳</span>
            <FormField label="Who plays this?" className="flex-1">
              <LineupSelect
                value={effectivePackageLineup(lineupChoices, t.id, templates)}
                lineupTemplates={lineupTemplates}
                onChange={(lineupTemplateId) => onPackageLineupChange?.(t.id, lineupTemplateId)}
              />
            </FormField>
          </div>
        )}
      </div>
    );
  }

  function chip(t: PackageTemplate) {
    const open = previewId === t.id;
    return (
      <div key={t.id} className="space-y-1.5">
        <div className="inline-flex items-center rounded-full border border-border text-sm transition-colors">
          <button
            type="button"
            onClick={() => onToggle(t.id)}
            aria-pressed={false}
            className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1.5 transition-colors hover:opacity-80"
          >
            <PackageIcon icon={t.icon} />
            {t.label}
          </button>
          <button
            type="button"
            aria-label={`${open ? 'Hide' : 'Preview'} ${t.label}`}
            aria-expanded={open}
            onClick={() => setPreviewId(open ? null : t.id)}
            className="border-l border-border px-2 py-1.5 text-muted transition-colors hover:text-foreground"
          >
            <Eye size={13} aria-hidden="true" />
          </button>
        </div>
        {open && (
          <div className="w-72 max-w-full rounded-lg border border-border bg-background p-3">
            <TemplatePreview template={t} showMusic={showMusic} />
          </div>
        )}
      </div>
    );
  }

  if (templatesLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (enabled.length === 0) return <p className="text-sm text-muted">No package templates yet.</p>;

  return (
    <div className="space-y-3">
      {selected.length > 0 && <div className="space-y-3">{selected.map(block)}</div>}
      <div className="flex flex-wrap items-start gap-2">{(matching.length > 0 ? matching : other).map(chip)}</div>
      {matching.length > 0 && other.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOtherOpen((o) => !o)}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {otherOpen ? '▾' : '▸'} Other packages ({other.length})
          </button>
          {otherOpen && <div className="mt-2 flex flex-wrap items-start gap-2">{other.map(chip)}</div>}
        </div>
      )}
    </div>
  );
}
