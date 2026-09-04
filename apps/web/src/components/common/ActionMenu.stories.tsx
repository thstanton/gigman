import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { ActionMenu } from './ActionMenu';

const editOnClick = fn();
const items = [
  { label: 'Edit', icon: React.createElement(Edit2, { size: 14 }), onClick: editOnClick },
  {
    label: 'Delete',
    icon: React.createElement(Trash2, { size: 14 }),
    onClick: fn(),
    variant: 'destructive' as const,
  },
];

const meta = {
  title: 'Common/ActionMenu',
  component: ActionMenu,
  tags: ['autodocs'],
  args: {
    sheetItems: items,
    dropdownItems: items,
    sheetTitle: 'Actions',
    mobileTrigger: { icon: React.createElement(MoreHorizontal, { size: 16 }), ariaLabel: 'Actions' },
    desktopTrigger: {
      icon: React.createElement(MoreHorizontal, { size: 16 }),
      ariaLabel: 'More actions',
    },
    // Placeholder — sheetOpen is always controlled, `render` below wires up the real state.
    sheetOpen: false,
    onSheetOpenChange: fn(),
  },
  render: (args) => {
    const [sheetOpen, setSheetOpen] = useState(false);
    return <ActionMenu {...args} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen} />;
  },
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Smoke: Story = {};

// ActionMenu never closes the sheet or dropdown itself on item click — that's the composing
// component's job (RowActions and CardMenu each wire it differently). This guards that the
// primitive doesn't quietly grow its own closing behaviour and clicking still reaches onClick.
export const MobileSheetOpensAndFires: Story = {
  play: async ({ canvas }) => {
    const trigger = await canvas.findByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);

    const body = within(document.body);
    await expect(body.findByText('Edit')).resolves.toBeVisible();
    const deleteBtn = await body.findByText('Delete');
    await expect(deleteBtn).toBeVisible();

    const editBtn = await body.findByText('Edit');
    await userEvent.click(editBtn);
    expect(editOnClick).toHaveBeenCalledOnce();
  },
};
