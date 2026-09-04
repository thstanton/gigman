import { useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubLabel } from '@/components/common/SubLabel';
import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu';

export interface CardMenuItem {
  label: string;
  /** Optional helper line shown under the label, to disambiguate similar actions. */
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface CardProps {
  title?: string;
  /** Primary header control (e.g. a labelled GhostButton). */
  action?: React.ReactNode;
  /** Secondary header actions, collapsed into a "…" overflow menu beside the primary action. */
  menu?: CardMenuItem[];
  className?: string;
  /**
   * Stable hook for e2e scoping. Several cards on one page expose an "Actions" trigger with the
   * same accessible name (this card's overflow menu and RowActions both use it), so a role query
   * alone cannot say *which* card — hence a testid on the card that owns the row.
   */
  testId?: string;
  children: React.ReactNode;
}

/**
 * Header overflow menu: a vertical-ellipsis trigger that opens a dropdown on desktop and a
 * bottom sheet on mobile. No row-level confirmation / pending semantics — every item just
 * closes the sheet and fires.
 */
function CardMenu({ items, label }: { items: CardMenuItem[]; label?: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const menuItems: ActionMenuItem[] = items.map((item) => ({
    label: item.label,
    description: item.description,
    icon: item.icon,
    onClick: () => {
      setSheetOpen(false);
      item.onClick();
    },
  }));

  return (
    <ActionMenu
      sheetItems={menuItems}
      dropdownItems={menuItems}
      sheetTitle={label}
      sheetOpen={sheetOpen}
      onSheetOpenChange={setSheetOpen}
      mobileTrigger={{
        icon: <EllipsisVertical size={16} />,
        ariaLabel: 'Actions',
        className: '-mr-1.5 flex h-10 w-10 items-center justify-center',
      }}
      desktopTrigger={{ icon: <EllipsisVertical size={16} />, ariaLabel: 'More actions' }}
    />
  );
}

export function Card({ title, action, menu, className, testId, children }: CardProps) {
  const hasMenu = !!menu && menu.length > 0;
  const hasHeader = !!title || !!action || hasMenu;

  return (
    <div className={cn('bg-background border border-border rounded-lg p-4', className)} data-testid={testId}>
      {hasHeader && (
        <div className="flex items-center justify-between mb-3">
          {title ? <SubLabel>{title}</SubLabel> : <span />}
          <div className="flex items-center gap-2">
            {action}
            {hasMenu && <CardMenu items={menu} label={title} />}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
