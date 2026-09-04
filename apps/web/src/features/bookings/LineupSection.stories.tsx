import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LineupSection } from './LineupSection';
import {
  EMPTY_LINEUP_CHOICES,
  addStandaloneLineup,
  removeStandaloneLineup,
  setPackageLineupOverride,
  type LineupChoices,
} from './lineupChoices';
import { lineupTemplate as lineup, packageTemplate as tmpl } from '@/test/factories';
import type { LineupTemplate, PackageTemplate } from '@/types/api';

const LINEUPS: LineupTemplate[] = [
  lineup({ id: 'l1', label: 'My four-piece', slots: [{ id: 'l1-a', role: 'Sax', order: 0 }, { id: 'l1-b', role: 'Drums', order: 1 }] }),
  lineup({ id: 'l2', label: 'Solo pianist', slots: [{ id: 'l2-a', role: 'Piano', order: 0 }] }),
];

const PACKAGES: PackageTemplate[] = [
  tmpl({ id: 'drinks', label: 'Drinks Reception', defaultLineupTemplateId: 'l1' }),
  tmpl({ id: 'evening', label: 'Evening Party', defaultLineupTemplateId: 'l1' }),
];

// Controlled harness mirroring the host: owns `choices` and computes the toggle exactly as a real
// container would with lineupChoices.ts's pure helpers.
function Harness({
  onToggleLineup,
  onCreateLineup,
  lineupTemplates = LINEUPS,
  selectedPackageTemplateIds = [],
  packageTemplates = PACKAGES,
  initialChoices = EMPTY_LINEUP_CHOICES,
}: {
  onToggleLineup: (id: string) => void;
  onCreateLineup?: () => void;
  lineupTemplates?: LineupTemplate[];
  selectedPackageTemplateIds?: string[];
  packageTemplates?: PackageTemplate[];
  initialChoices?: LineupChoices;
}) {
  const [choices, setChoices] = useState<LineupChoices>(initialChoices);
  return (
    <LineupSection
      lineupTemplates={lineupTemplates}
      choices={choices}
      selectedPackageTemplateIds={selectedPackageTemplateIds}
      packageTemplates={packageTemplates}
      onCreateLineup={onCreateLineup}
      onToggleLineup={(id) => {
        setChoices((c) => (c.standalone.includes(id) ? removeStandaloneLineup(c, id) : addStandaloneLineup(c, id)));
        onToggleLineup(id);
      }}
    />
  );
}

const meta: Meta<typeof LineupSection> = {
  component: LineupSection,
  tags: ['ai-generated'],
  args: { onToggleLineup: fn(), onCreateLineup: fn() },
  render: (args) => (
    <Harness
      onToggleLineup={args.onToggleLineup}
      onCreateLineup={args.onCreateLineup}
      lineupTemplates={args.lineupTemplates}
      selectedPackageTemplateIds={args.selectedPackageTemplateIds}
      packageTemplates={args.packageTemplates}
      initialChoices={args.choices}
    />
  ),
};

export default meta;
type Story = StoryObj<typeof LineupSection>;

// ADR-0081 §5 constraint 3 / Story 39 guard: absent entirely for a musician with no lineup
// templates — the whole section, heading included, since it owns its own chrome.
export const NoLineupTemplates: Story = {
  name: 'No lineup templates -> renders nothing at all (constraint 3, Story 39 guard)',
  args: { lineupTemplates: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('heading', { name: 'Lineup' })).toBeNull();
    await expect(canvasElement).toBeEmptyDOMElement();
  },
};

// The default-selected state: a selected package's own defaultLineupTemplateId puts its lineup in
// the group with no musician action — reachable only via the package select, so this block has no
// click-to-remove (see the component's own "Set by a package above" note).
export const DefaultFromASelectedPackage: Story = {
  name: 'A package\'s default lineup shows as an active, package-derived block',
  args: { selectedPackageTemplateIds: ['drinks'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('My four-piece')).toBeVisible();
    await expect(canvas.getByText('Sax · Drums')).toBeVisible();
    await expect(canvas.getByText('Plays Drinks Reception')).toBeVisible();
    await expect(canvas.getByText('Set by a package above.')).toBeVisible();
    // Package-derived: the label is plain text, not a button — there is nothing to toggle off here.
    await expect(canvas.queryByRole('button', { name: 'My four-piece' })).toBeNull();
  },
};

// Overriding a package's select to a different lineup (simulated here via an explicit override,
// as the real PackagePicker block would set) still reads as package-derived, not standalone.
export const OverriddenAwayFromTheDefault: Story = {
  name: 'An overridden package lineup still reads as package-derived',
  args: {
    selectedPackageTemplateIds: ['drinks'],
    choices: setPackageLineupOverride(EMPTY_LINEUP_CHOICES, 'drinks', 'l2'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Solo pianist')).toBeVisible();
    await expect(canvas.getByText('Piano')).toBeVisible();
    // My four-piece is still in the library, so it renders as an unselected pill — just not
    // the active block, since 'drinks' was explicitly pointed at Solo pianist instead.
    await expect(canvas.getByRole('button', { name: 'My four-piece' })).toHaveAttribute('aria-pressed', 'false');
  },
};

// "Decide later" reads as a deliberate choice, not an empty state — every package select left at
// "Decide later" (an explicit null override) with nothing declared standalone.
export const DecideLater: Story = {
  name: '"Decide later" — nothing chosen reads as a deliberate state, not a dead end',
  args: {
    selectedPackageTemplateIds: ['drinks', 'evening'],
    choices: {
      overrides: { drinks: null, evening: null },
      standalone: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Decide later — no lineup is applied until you choose one.')).toBeVisible();
    // Both lineups are still offered as pills — "Decide later" means nothing is active, not
    // that the library is hidden.
    await expect(canvas.getByRole('button', { name: 'My four-piece' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('button', { name: 'Solo pianist' })).toHaveAttribute('aria-pressed', 'false');
  },
};

// The package-less musician's case (#982's resolution): no packages selected at all, but a
// lineup declared standalone still says the whole gig is covered.
export const StandaloneOnAPackageLessBooking: Story = {
  name: 'A standalone lineup on a package-less booking plays the whole gig',
  args: {
    selectedPackageTemplateIds: [],
    choices: addStandaloneLineup(EMPTY_LINEUP_CHOICES, 'l1'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Plays the whole gig')).toBeVisible();
    // Standalone (musician's own pill toggle): removable, so it IS a button.
    await expect(canvas.getByRole('button', { name: /My four-piece/ })).toHaveAttribute('aria-pressed', 'true');
  },
};

// Primary interaction happy path: toggling a lineup on turns it into a removable block; toggling
// it off returns it to a pill; the eye preview on an unselected pill shows its Parts.
export const ToggleLineupPillOnAndOff: Story = {
  name: 'Toggling a lineup pill lifts it into a block, and back, previewing Parts when unselected',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Preview Solo pianist/i }));
    await expect(canvas.getByText('Parts')).toBeVisible();
    await expect(canvas.getByText('Piano')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'My four-piece' }));
    await expect(args.onToggleLineup).toHaveBeenCalledWith('l1');
    await expect(canvas.getByRole('button', { name: /My four-piece/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('Plays the whole gig')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: /My four-piece/ }));
    await expect(canvas.queryByText('Plays the whole gig')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'My four-piece' })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const CreateLineupAffordance: Story = {
  name: '"+ New lineup" fires the create callback',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'New lineup' }));
    await expect(args.onCreateLineup).toHaveBeenCalled();
  },
};
