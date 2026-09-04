import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export interface ActionMenuItem {
  label: string;
  /** Optional helper line shown under the label, to disambiguate similar actions. */
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Grouped after a separator and styled destructive. */
  variant?: 'destructive';
}

interface ActionMenuTrigger {
  icon: React.ReactNode;
  ariaLabel: string;
  className?: string;
}

interface ActionMenuProps {
  /** Items rendered in the mobile bottom sheet, when `sheetBody` is not supplied. */
  sheetItems: ActionMenuItem[];
  /** Items rendered in the desktop dropdown. Callers whose per-item behaviour differs by
   * surface (e.g. a confirmation flow that opens a dialog only on desktop) pass a
   * differently-wired array here than in `sheetItems`. */
  dropdownItems: ActionMenuItem[];
  sheetTitle?: string;
  sheetSublabel?: string;
  mobileTrigger: ActionMenuTrigger;
  desktopTrigger: ActionMenuTrigger;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  /** Overrides the sheet's default item-list body (e.g. an in-place confirmation panel). The
   * desktop dropdown is unaffected. */
  sheetBody?: React.ReactNode;
  /** Extra element rendered before the desktop trigger, inside the same row (e.g. a primary
   * action's always-visible icon shortcut). */
  desktopLeadingContent?: React.ReactNode;
}

/** Label + optional helper line, shared by the desktop dropdown and the mobile sheet. */
function ItemLabel({ item }: { item: ActionMenuItem }) {
  if (!item.description) return <span>{item.label}</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <span>{item.label}</span>
      <span className="text-xs font-normal text-muted">{item.description}</span>
    </span>
  );
}

function groupItems(items: ActionMenuItem[]) {
  return {
    defaultItems: items.filter((item) => item.variant !== 'destructive'),
    destructiveItems: items.filter((item) => item.variant === 'destructive'),
  };
}

function SheetItemList({ items }: { items: ActionMenuItem[] }) {
  const { defaultItems, destructiveItems } = groupItems(items);
  return (
    <div className="space-y-1">
      {defaultItems.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={item.disabled}
          className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          onClick={item.onClick}
        >
          {item.icon}
          <ItemLabel item={item} />
        </button>
      ))}
      {destructiveItems.length > 0 && (
        <>
          <Separator />
          {destructiveItems.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-destructive hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              onClick={item.onClick}
            >
              {item.icon}
              <ItemLabel item={item} />
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function DropdownItemList({ items }: { items: ActionMenuItem[] }) {
  const { defaultItems, destructiveItems } = groupItems(items);
  return (
    <>
      {defaultItems.map((item) => (
        <DropdownMenuItem key={item.label} disabled={item.disabled} onClick={item.onClick}>
          {item.icon}
          <ItemLabel item={item} />
        </DropdownMenuItem>
      ))}
      {destructiveItems.length > 0 && (
        <>
          <DropdownMenuSeparator />
          {destructiveItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              disabled={item.disabled}
              className="text-destructive focus:text-destructive"
              onClick={item.onClick}
            >
              {item.icon}
              <ItemLabel item={item} />
            </DropdownMenuItem>
          ))}
        </>
      )}
    </>
  );
}

/**
 * Responsive action-menu shell: a configurable trigger that opens a desktop dropdown or a
 * mobile bottom sheet. Owns only the trigger, the sheet/dropdown mount, and generic item
 * rendering — confirmation, pending state, and closing-on-click are the composing component's
 * responsibility (see `RowActions` and `Card`'s `CardMenu`).
 */
export function ActionMenu({
  sheetItems,
  dropdownItems,
  sheetTitle,
  sheetSublabel,
  mobileTrigger,
  desktopTrigger,
  sheetOpen,
  onSheetOpenChange,
  sheetBody,
  desktopLeadingContent,
}: ActionMenuProps) {
  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        aria-label={mobileTrigger.ariaLabel}
        className={cn(
          'text-muted transition-colors hover:text-foreground md:hidden',
          mobileTrigger.className
        )}
        onClick={() => onSheetOpenChange(true)}
      >
        {mobileTrigger.icon}
      </button>

      {/* Mobile bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent side="bottom" className="border-t-0">
          <SheetTitle className={sheetTitle ? undefined : 'sr-only'}>
            {sheetTitle ?? 'Actions'}
          </SheetTitle>
          {sheetTitle && sheetSublabel && <p className="text-sm text-muted">{sheetSublabel}</p>}
          <div className={sheetTitle ? 'mt-3' : undefined}>
            {sheetBody ?? <SheetItemList items={sheetItems} />}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop trigger + dropdown */}
      <div className="hidden items-center gap-1 md:flex">
        {desktopLeadingContent}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={desktopTrigger.ariaLabel}
            className={cn('text-muted transition-colors hover:text-foreground', desktopTrigger.className)}
          >
            {desktopTrigger.icon}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownItemList items={dropdownItems} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
