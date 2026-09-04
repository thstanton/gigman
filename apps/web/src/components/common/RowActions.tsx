import { useState, useEffect } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu';

export interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'destructive';
  confirmation?: { title: string; description: string };
  isPending?: boolean;
}

interface Props {
  actions: RowAction[];
  label?: string;
  sublabel?: string;
}

export function RowActions({ actions, label, sublabel }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmingLabel, setConfirmingLabel] = useState<string | null>(null);
  const [confirmFired, setConfirmFired] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const primaryAction = actions[0];

  // Derive current action from label so isPending stays fresh across renders
  const confirmingAction = confirmingLabel
    ? (actions.find((a) => a.label === confirmingLabel) ?? null)
    : null;
  const isConfirmPending = confirmingAction?.isPending ?? false;

  // Close when a pending action completes (or errors)
  useEffect(() => {
    if (confirmFired && !isConfirmPending) {
      setConfirmingLabel(null);
      setConfirmFired(false);
      setSheetOpen(false);
      setDialogOpen(false);
    }
  }, [confirmFired, isConfirmPending]);

  function handleSheetAction(action: RowAction) {
    if (action.isPending) return;
    if (action.confirmation) {
      setConfirmingLabel(action.label);
      setConfirmFired(false);
    } else {
      setSheetOpen(false);
      action.onClick();
    }
  }

  function handleConfirmInSheet() {
    if (!confirmingAction) return;
    confirmingAction.onClick();
    if (confirmingAction.isPending !== undefined) {
      setConfirmFired(true);
    } else {
      setConfirmingLabel(null);
      setSheetOpen(false);
    }
  }

  function handleSheetOpenChange(open: boolean) {
    if (!open && isConfirmPending) return;
    if (!open) {
      setConfirmingLabel(null);
      setConfirmFired(false);
    }
    setSheetOpen(open);
  }

  function handleDropdownAction(action: RowAction) {
    if (action.isPending) return;
    if (action.confirmation) {
      setConfirmingLabel(action.label);
      setConfirmFired(false);
      setDialogOpen(true);
    } else {
      action.onClick();
    }
  }

  function handleDialogConfirm() {
    if (!confirmingAction) return;
    confirmingAction.onClick();
    if (confirmingAction.isPending !== undefined) {
      setConfirmFired(true);
    } else {
      setConfirmingLabel(null);
      setDialogOpen(false);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open && isConfirmPending) return;
    if (!open) {
      setConfirmingLabel(null);
      setConfirmFired(false);
    }
    setDialogOpen(open);
  }

  function toMenuItem(action: RowAction, onClick: () => void): ActionMenuItem {
    return {
      label: action.isPending ? '…' : action.label,
      icon: action.icon,
      onClick,
      disabled: action.isPending,
      variant: action.variant,
    };
  }

  const sheetItems = actions.map((action) => toMenuItem(action, () => handleSheetAction(action)));
  const dropdownItems = actions.map((action) =>
    toMenuItem(action, () => handleDropdownAction(action))
  );

  const sheetBody = confirmingAction ? (
    <div className="space-y-4 pb-2">
      <p className="font-semibold">{confirmingAction.confirmation!.title}</p>
      <p className="text-sm text-muted">{confirmingAction.confirmation!.description}</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={isConfirmPending}
          onClick={() => {
            setConfirmingLabel(null);
            setConfirmFired(false);
          }}
        >
          Cancel
        </Button>
        <Button variant="destructive" disabled={isConfirmPending} onClick={handleConfirmInSheet}>
          {isConfirmPending ? '…' : 'Confirm'}
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <ActionMenu
        sheetItems={sheetItems}
        dropdownItems={dropdownItems}
        sheetTitle={label}
        sheetSublabel={sublabel}
        sheetOpen={sheetOpen}
        onSheetOpenChange={handleSheetOpenChange}
        sheetBody={sheetBody}
        mobileTrigger={{ icon: <ChevronRight size={16} />, ariaLabel: 'Actions' }}
        desktopTrigger={{ icon: <MoreHorizontal size={16} />, ariaLabel: 'More actions' }}
        desktopLeadingContent={
          primaryAction?.icon && (
            <button
              type="button"
              aria-label={primaryAction.label}
              disabled={primaryAction.isPending}
              className="text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => handleDropdownAction(primaryAction)}
            >
              {primaryAction.icon}
            </button>
          )
        }
      />

      {/* Desktop confirmation dialog (the dropdown trigger is desktop-only) */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmingAction?.confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmingAction?.confirmation?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              disabled={isConfirmPending}
              onClick={() => {
                setDialogOpen(false);
                setConfirmingLabel(null);
                setConfirmFired(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={isConfirmPending} onClick={handleDialogConfirm}>
              {isConfirmPending ? '…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
