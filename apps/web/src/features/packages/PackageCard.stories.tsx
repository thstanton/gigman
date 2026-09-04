import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { PackageCard } from './PackageCard';
import { packageTemplate, lineupTemplate } from '@/test/factories';

// #990: feature-adjacent presentational component — interaction play covering the primary happy
// path (ADR-0024). `lineup` is a prop, never read from the flag, so both Default lineup states are
// reachable in Storybook even though VITE_ flags can't be exercised here.
const meta = {
  component: PackageCard,
  tags: ['ai-generated'],
  args: { onEdit: fn() },
} satisfies Meta<typeof PackageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const pkg = packageTemplate({
  id: 'p1',
  label: 'Wedding day',
  slots: [{ id: 'p1-s1', label: 'Ceremony', duration: 30, order: 0 }],
});

const fourPiece = lineupTemplate({ id: 'l1', label: 'My four-piece' });

export const WithDefaultLineup: Story = {
  args: { pkg, lineup: fourPiece },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Wedding day')).toBeVisible();
    await expect(canvas.getByText('Default lineup')).toBeVisible();
    await expect(canvas.getByText('My four-piece')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(args.onEdit).toHaveBeenCalledWith(pkg);
  },
};

export const WithoutDefaultLineup: Story = {
  args: { pkg, lineup: null },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Default lineup')).toBeVisible();
    await expect(canvas.getByText('None')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(args.onEdit).toHaveBeenCalledWith(pkg);
  },
};
