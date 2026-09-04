import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiPatch } from '@/lib/api';
import { toast } from '@/lib/hooks/use-toast';
import type { LineupTemplate, PackageTemplate, UpdatePackageInput } from '@/types/api';
import { Card } from '@/components/common/Card';
import { SubLabel } from '@/components/common/SubLabel';
import { PackageIcon } from '@/components/common/PackageIcon';
import { PackageMusicSummary } from '@/features/packages/PackageMusicSummary';

// #990: `lineup` is the resolved default lineup, not the flag or the query — that stays owned by
// PackagesPage. `undefined` means "no library to resolve against" (flag off — render nothing, same
// as PackageForm's own `{lineups && (…)}` gate); `null` means "resolved, and unset" (render the
// block with "None").
export function PackageCard({
  pkg,
  lineup,
  onEdit,
}: {
  pkg: PackageTemplate;
  lineup?: LineupTemplate | null;
  onEdit: (pkg: PackageTemplate) => void;
}) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: (enabled: boolean) =>
      apiPatch<PackageTemplate>(`/packages/${pkg.id}`, { enabled } as UpdatePackageInput),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: ['packages'] });
      const previous = qc.getQueryData<PackageTemplate[]>(['packages']);
      qc.setQueryData<PackageTemplate[]>(['packages'], (old) =>
        old?.map((p) => (p.id === pkg.id ? { ...p, enabled } : p)),
      );
      return { previous };
    },
    onError: (_err, _enabled, context) => {
      if (context?.previous) qc.setQueryData(['packages'], context.previous);
      toast({ title: 'Failed to update package', variant: 'destructive' });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <PackageIcon icon={pkg.icon} size={15} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium text-foreground truncate">{pkg.label}</span>
        </div>
        <Switch
          checked={pkg.enabled}
          onCheckedChange={(checked) => toggle.mutate(checked)}
          aria-label={pkg.enabled ? 'Disable package' : 'Enable package'}
        />
      </div>

      {pkg.slots.length > 0 && (
        <ul className="space-y-1">
          {pkg.slots.map((slot) => (
            <li key={slot.id} className="text-sm text-muted flex items-center gap-2">
              <span className="flex-1 truncate">{slot.label || 'Unnamed'}</span>
              <span className="flex-shrink-0">{slot.duration} min</span>
            </li>
          ))}
        </ul>
      )}

      {/* #990: sibling of PackageMusicSummary, never inside it — that component is shared with
          the booking-time PackagePicker preview, where #982 decided parts are not repeated. */}
      {lineup !== undefined && (
        <div>
          <SubLabel>Default lineup</SubLabel>
          {lineup ? (
            <p className="text-sm text-foreground">{lineup.label}</p>
          ) : (
            <p className="text-sm text-muted">None</p>
          )}
        </div>
      )}

      {/* Intrinsic template data on the management surface — always shown when present (no gate). */}
      <PackageMusicSummary genres={pkg.defaultGenreSelection} moments={pkg.keyMoments} />

      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(pkg)}
        className="w-full"
      >
        Edit
      </Button>
    </Card>
  );
}
