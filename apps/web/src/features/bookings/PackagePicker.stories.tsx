import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PackagePicker } from './PackagePicker';
import { EMPTY_LINEUP_CHOICES, setPackageLineupOverride, type LineupChoices } from './lineupChoices';
import { packageTemplate as tmpl, lineupTemplate as lineup } from '@/test/factories';
import type { LineupTemplate, PackageTemplate } from '@/types/api';

const TEMPLATES: PackageTemplate[] = [
  tmpl({
    id: 't1', label: 'Wedding Ceremony', category: 'WEDDING', icon: 'church',
    slots: [
      { id: 't1-a', label: 'Processional', duration: 5, order: 0 },
      { id: 't1-b', label: 'Recessional', duration: 5, order: 1 },
    ],
    defaultGenreSelection: ['Classical', 'Acoustic'],
    keyMoments: ['First kiss'],
    defaultLineupTemplateId: 'l1',
  }),
  tmpl({ id: 't2', label: 'Evening Reception', category: 'WEDDING', icon: 'moon' }),
  tmpl({ id: 't3', label: 'Conference Day', category: 'CORPORATE', icon: 'briefcase' }),
];

const LINEUPS: LineupTemplate[] = [
  lineup({ id: 'l1', label: 'My four-piece', slots: [{ id: 'l1-a', role: 'Sax', order: 0 }, { id: 'l1-b', role: 'Drums', order: 1 }] }),
  lineup({ id: 'l2', label: 'Solo pianist', slots: [{ id: 'l2-a', role: 'Piano', order: 0 }] }),
];

// Controlled harness mirroring the host (create/Builder) that owns the selection AND the lineup
// choices (#989) — a real host derives the latter via lineupChoices.ts's pure helpers, exactly
// as this harness does with setPackageLineupOverride.
function Harness({
  onToggle,
  onPackageLineupChange,
  showMusic,
  templates = TEMPLATES,
  lineupTemplates = [],
  initialSelected = [],
}: {
  onToggle: (id: string) => void;
  onPackageLineupChange?: (packageTemplateId: string, lineupTemplateId: string | null) => void;
  showMusic: boolean;
  templates?: PackageTemplate[];
  lineupTemplates?: LineupTemplate[];
  initialSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [choices, setChoices] = useState<LineupChoices>(EMPTY_LINEUP_CHOICES);
  return (
    <PackagePicker
      templates={templates}
      eventType="WEDDING"
      selectedIds={selected}
      onToggle={(id) => { setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); onToggle(id); }}
      showMusic={showMusic}
      lineupTemplates={lineupTemplates}
      lineupChoices={choices}
      onPackageLineupChange={(packageTemplateId, lineupTemplateId) => {
        setChoices((c) => setPackageLineupOverride(c, packageTemplateId, lineupTemplateId));
        onPackageLineupChange?.(packageTemplateId, lineupTemplateId);
      }}
    />
  );
}

const meta: Meta<typeof PackagePicker> = {
  component: PackagePicker,
  tags: ['ai-generated'],
  args: { onToggle: fn(), onPackageLineupChange: fn(), showMusic: true },
  render: (args) => (
    <Harness
      onToggle={args.onToggle}
      onPackageLineupChange={args.onPackageLineupChange}
      showMusic={args.showMusic ?? true}
      templates={args.templates}
      lineupTemplates={args.lineupTemplates}
      initialSelected={args.selectedIds}
    />
  ),
};

export default meta;
type Story = StoryObj<typeof PackagePicker>;

export const Grouping: Story = {
  name: 'Matching templates lead; non-matching collapse under "Other packages"',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wedding templates (matching the event type) are visible up front. Exact names target the
    // select chip, not its sibling "Preview …" eye button.
    await expect(canvas.getByRole('button', { name: 'Wedding Ceremony' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Evening Reception' })).toBeVisible();
    // The corporate one is tucked under "Other packages" until expanded.
    await expect(canvas.queryByRole('button', { name: 'Conference Day' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: /Other packages \(1\)/i }));
    await expect(canvas.getByRole('button', { name: 'Conference Day' })).toBeVisible();
  },
};

export const EmptyLibrary: Story = {
  name: 'Empty library reads as "not yet", not as a dead end',
  args: { templates: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No package templates yet.')).toBeVisible();
  },
};

export const Multiselect: Story = {
  name: 'Multiselect: clicking a chip lifts it into a block; clicking the block returns it to a chip',
  // #989: selecting a template swaps its underlying element (chip -> block header), so each
  // assertion re-queries by accessible name rather than reusing a pre-click element reference.
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Wedding Ceremony' }));
    await expect(canvas.getByRole('button', { name: 'Wedding Ceremony' })).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onToggle).toHaveBeenCalledWith('t1');

    await userEvent.click(canvas.getByRole('button', { name: 'Evening Reception' }));
    await expect(canvas.getByRole('button', { name: 'Evening Reception' })).toHaveAttribute('aria-pressed', 'true');

    // Clicking the block's own header returns it to an unselected chip.
    await userEvent.click(canvas.getByRole('button', { name: 'Wedding Ceremony' }));
    await expect(canvas.getByRole('button', { name: 'Wedding Ceremony' })).toHaveAttribute('aria-pressed', 'false');
  },
};

// #982's resolution: "a selected package leaves the chip row and becomes a block", always
// visible regardless of its event-type category — there is no "force this group open" case left
// to prove, since a selected template is never chip-grouped at all.
export const SelectedTemplateBecomesABlock: Story = {
  name: 'A selected non-matching template becomes a block, entirely outside the chip grouping',
  args: { selectedIds: ['t3'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const conference = canvas.getByRole('button', { name: 'Conference Day' });
    await expect(conference).toBeVisible();
    await expect(conference).toHaveAttribute('aria-pressed', 'true');
    // No "Other packages" toggle at all — its only non-matching template is now a block.
    await expect(canvas.queryByRole('button', { name: /Other packages/i })).toBeNull();
  },
};

export const PreviewShowsMusic: Story = {
  name: 'Preview lists sets and (when music is on) the named genres + special requests',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Preview Wedding Ceremony/i }));
    await expect(canvas.getByText('Processional')).toBeVisible();
    await expect(canvas.getByText(/Genres the client can request songs from/i)).toBeVisible();
    await expect(canvas.getByText('Classical')).toBeVisible();
    await expect(canvas.getByText('First kiss')).toBeVisible();
  },
};

export const PreviewHidesMusicWhenOff: Story = {
  name: 'Preview hides the music-form section when the song-request form is off',
  args: { showMusic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Preview Wedding Ceremony/i }));
    await expect(canvas.getByText('Processional')).toBeVisible();
    await expect(canvas.queryByText(/Genres the client can request songs from/i)).toBeNull();
  },
};

// #982's resolution: "Sets are always shown on a selected block — the block is the expanded
// chip, so nothing is lost by selecting." No eye click needed, unlike an unselected chip.
export const SelectedBlockAlwaysShowsItsContent: Story = {
  name: 'A selected block shows its sets and music summary without an eye click',
  args: { selectedIds: ['t1'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Processional')).toBeVisible();
    await expect(canvas.getByText(/Genres the client can request songs from/i)).toBeVisible();
    // And there is no eye/preview control on the block itself.
    await expect(canvas.queryByRole('button', { name: /Preview Wedding Ceremony/i })).toBeNull();
  },
};

// Story 39 guard (#989's AC): a musician with no lineup templates sees byte-for-byte what the
// picker rendered before #989 — no "Who plays this?" select on any block, selected or not.
export const NoLineupTemplatesRendersUnchanged: Story = {
  name: 'Story 39 guard: no lineup templates -> no select on any block (ADR-0081 §5 constraint 3)',
  args: { selectedIds: ['t1'], lineupTemplates: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Wedding Ceremony' })).toBeVisible();
    await expect(canvas.queryByText('Who plays this?')).toBeNull();
    await expect(canvas.queryByRole('combobox')).toBeNull();
  },
};

// The primary #989 happy path: a selected block with lineup templates present shows the "Who
// plays this?" select, pre-filled from the template's own defaultLineupTemplateId, and reports
// both an override and an explicit "Decide later" through the same callback.
export const LineupSelectOnASelectedBlock: Story = {
  name: 'Lineup select is pre-filled from the template default, and reports overrides + "Decide later"',
  args: { selectedIds: ['t1'], lineupTemplates: LINEUPS },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Who plays this?')).toBeVisible();
    // Wedding Ceremony's defaultLineupTemplateId is 'l1' — pre-filled without the musician touching it.
    await expect(canvas.getByRole('combobox', { name: 'Who plays this?' })).toHaveTextContent('My four-piece');

    // Radix Select portals its listbox to document.body, outside canvasElement.
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Who plays this?' }));
    await userEvent.click(body.getByRole('option', { name: 'Solo pianist' }));
    await expect(args.onPackageLineupChange).toHaveBeenCalledWith('t1', 'l2');
    await expect(canvas.getByRole('combobox', { name: 'Who plays this?' })).toHaveTextContent('Solo pianist');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Who plays this?' }));
    await userEvent.click(body.getByRole('option', { name: 'Decide later' }));
    await expect(args.onPackageLineupChange).toHaveBeenCalledWith('t1', null);
    await expect(canvas.getByRole('combobox', { name: 'Who plays this?' })).toHaveTextContent('Decide later');
  },
};
