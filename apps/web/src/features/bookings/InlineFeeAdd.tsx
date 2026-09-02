import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';
import { Input } from '@/components/ui/input';
import { formatFee } from '@/lib/formatters';

// The app's ONE fee editor. #983 found two doing the same job with different markup — this, for the
// booking fee, and BandMemberRow's own for the session fee, whose trigger rendered `text-muted` and
// so read as a label rather than a control. #987 gave this one a `value` seed and deleted the other
// rather than letting a third appear.
//
// Trigger convention (shared with DueDateEditor, GoalRow, AddSongField, PackageForm): an editable
// value is `text-primary hover:underline` — `£180 ✎` when set, `+ Add fee` when not.

export interface InlineFeeAddProps {
  /** Current fee, as the API's decimal string. Omit (or null) for the add-a-fee case. */
  value?: string | null;
  onSave: (fee: number | null) => void;
  isSaving: boolean;
  /** Distinguishes several of these on one screen (one per player on the Band sheet). */
  label?: string;
}

export default function InlineFeeAdd({ value = null, onSave, isSaving, label = 'fee' }: InlineFeeAddProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const formatted = formatFee(value ?? null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? '');
          setEditing(true);
        }}
        aria-label={formatted ? `Edit ${label}` : `Add ${label}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        {formatted ? (
          <>
            {formatted}
            <Pencil size={11} />
          </>
        ) : (
          '+ Add fee'
        )}
      </button>
    );
  }

  // Clearing the field saves `null` — how a fee set by mistake is taken off again. The predecessor
  // could only ever set one, so a wrong fee was unremovable from the sheet.
  function commit() {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onSave(null);
    } else {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) return;
      onSave(parsed);
    }
    setEditing(false);
    setDraft('');
  }

  // A div, not a <form>: this editor sits inside the Builder's own form (#991) and inside the Band
  // sheet, and a nested <form> is invalid HTML. Enter commits explicitly instead of by submission.
  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        type="number"
        min="0"
        step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setEditing(false); setDraft(''); }
        }}
        placeholder="0.00"
        aria-label={`${label} amount`}
        className="h-8 w-28 text-sm"
        disabled={isSaving}
      />
      <button
        type="button"
        onClick={commit}
        disabled={isSaving}
        className="text-status-confirmed hover:text-status-confirmed/70 disabled:opacity-40 transition-colors"
        aria-label={`Save ${label}`}
      >
        <Check size={16} />
      </button>
      <IconButton label={`Cancel ${label}`} onClick={() => { setEditing(false); setDraft(''); }}>
        <X size={16} />
      </IconButton>
    </div>
  );
}
