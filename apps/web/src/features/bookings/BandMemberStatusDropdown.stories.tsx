import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { BandMemberStatusDropdown } from './BandMemberStatusDropdown';
import { BAND_MEMBER_STATUS_ORDER } from '@/lib/constants';

// #983: the pill IS the dropdown. Round 1 rendered a StatusPill and a <select> side by side, so the
// status word appeared twice — the first thing called out. This is BookingStatusDropdown's trigger
// pattern, so the app's two status controls match.

const meta = {
  component: BandMemberStatusDropdown,
  tags: ['ai-generated'],
  args: {
    status: 'CONFIRMED',
    memberName: 'Sam Okonkwo',
    onChange: fn(),
    isPending: false,
  },
} satisfies Meta<typeof BandMemberStatusDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // The status appears once, in the thing you press.
    const trigger = canvas.getByRole('button', { name: 'Status for Sam Okonkwo' });
    await expect(trigger).toHaveTextContent('Confirmed');
    await expect(canvas.queryAllByText('Confirmed')).toHaveLength(1);
  },
};

export const OpensToEveryStatus: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Status for Sam Okonkwo' }));
    const menu = within(await screen.findByRole('menu'));
    // Every member of the vocabulary, in the table's order — derived, never re-listed here.
    await expect(menu.getAllByRole('menuitem')).toHaveLength(BAND_MEMBER_STATUS_ORDER.length);
    await userEvent.click(menu.getByRole('menuitem', { name: /Invited/ }));
    await expect(args.onChange).toHaveBeenCalledWith('INVITED');
  },
};

export const Pending: Story = {
  args: { isPending: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Status for Sam Okonkwo' })).toBeDisabled();
  },
};
