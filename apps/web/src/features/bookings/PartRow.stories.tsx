import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { X } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';
import { PartRow } from './PartRow';

// #983's part shape, used for a part and nothing else — and used IDENTICALLY under a player and in
// `Parts to fill`. These stories pin the two decisions it carries: the narrower LabelValue column
// (a className override on the primitive, not a copy of its styling), and the rule that a part row
// names its band only when the booking has more than one.

const meta = {
  component: PartRow,
  tags: ['ai-generated'],
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: {
    role: 'Bass',
    callTime: '18:00',
  },
} satisfies Meta<typeof PartRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'One band on the booking — no band name on the row',
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Bass')).toBeVisible();
    await expect(canvas.getByText('18:00')).toBeVisible();
  },
};

export const NamesItsBand: Story = {
  name: 'Two bands on the booking — the row names which one this part belongs to',
  args: { bandName: 'My four-piece' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('My four-piece')).toBeVisible();
  },
};

export const NoCallTime: Story = {
  name: 'No timed set behind it — absent, not zero',
  args: { callTime: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No call time')).toBeVisible();
  },
};

export const WithAction: Story = {
  name: 'The row carries exactly one action',
  args: {
    action: (
      <IconButton label="Empty the Bass part" onClick={fn()}>
        <X size={14} />
      </IconButton>
    ),
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Empty the Bass part' });
    await userEvent.click(button);
    await expect(button).toBeVisible();
  },
};
