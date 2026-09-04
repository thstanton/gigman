import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGet } from '@/lib/api';
import { isEnabled } from '@/lib/featureFlags';
import { useLineupTemplates } from '@/lib/hooks/useLineupTemplates';
import { PACKAGE_CATEGORY_LABELS, PACKAGE_CATEGORY_ORDER } from '@/lib/constants';
import type { LineupTemplate, PackageTemplate } from '@/types/api';
import { EmptyState } from '@/components/common/EmptyState';
import { PageSection } from '@/components/common/PageSection';
import { PackageCard, resolveDefaultLineup } from '@/features/packages/PackageCard';
import { PackageDrawer, type PackageDrawerMode } from '@/features/packages/PackageDrawer';
import { LineupList } from '@/features/packages/LineupList';
import { LineupDrawer, type LineupDrawerMode } from '@/features/packages/LineupDrawer';

const BAND_MEMBERS_FLAG = 'VITE_FEATURE_BAND_MEMBERS';

// ─── Category group ───────────────────────────────────────────────────────────

function CategoryGroup({
  title,
  packages,
  lineupsById,
  onEdit,
}: {
  title: string;
  packages: PackageTemplate[];
  lineupsById?: Map<string, LineupTemplate>;
  onEdit: (pkg: PackageTemplate) => void;
}) {
  if (packages.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            lineup={resolveDefaultLineup(pkg, lineupsById)}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Lineups tab ────────────────────────────────────────────────────────────

function LineupsTab() {
  const { isLoaded } = useAuth();
  const [drawerMode, setDrawerMode] = useState<LineupDrawerMode | null>(null);

  const { data: lineups = [], isLoading } = useQuery({
    queryKey: ['lineups'],
    queryFn: () => apiGet<LineupTemplate[]>('/lineups'),
    enabled: isLoaded,
  });

  return (
    <div className="space-y-6">
      <PageSection title="Lineups">
        <Button onClick={() => setDrawerMode({ type: 'create' })}>+ New lineup</Button>
      </PageSection>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <LineupList
          lineups={lineups}
          onEdit={(lineup) => setDrawerMode({ type: 'edit', lineup })}
          onCreate={() => setDrawerMode({ type: 'create' })}
        />
      )}

      {drawerMode && (
        <LineupDrawer mode={drawerMode} open={drawerMode != null} onClose={() => setDrawerMode(null)} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  const { isLoaded } = useAuth();
  const [drawerMode, setDrawerMode] = useState<PackageDrawerMode | null>(null);
  const bandMembersEnabled = isEnabled(BAND_MEMBERS_FLAG);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => apiGet<PackageTemplate[]>('/packages'),
    enabled: isLoaded,
  });

  // #990: same key + gate PackageDrawer already fetches under — TanStack dedupes it. Undefined
  // (flag off) is threaded through to PackageCard, which renders no Default lineup block at all.
  const { data: lineups } = useLineupTemplates(bandMembersEnabled);
  const lineupsById = lineups && new Map(lineups.map((l) => [l.id, l]));

  const grouped = PACKAGE_CATEGORY_ORDER.reduce<Record<string, PackageTemplate[]>>((acc, cat) => {
    acc[cat] = packages.filter((p) => p.category === cat);
    return acc;
  }, {});
  const uncategorised = packages.filter((p) => !p.category);

  const packagesPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Package Templates</h1>
        <Button onClick={() => setDrawerMode({ type: 'create' })}>+ New package</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && packages.length === 0 && (
        <EmptyState
          icon={<Music size={40} strokeWidth={1.5} />}
          heading="No package templates yet"
          description="Create a package template to get started."
          action={<Button onClick={() => setDrawerMode({ type: 'create' })}>New package</Button>}
        />
      )}

      {!isLoading && packages.length > 0 && (
        <div className="space-y-8">
          {PACKAGE_CATEGORY_ORDER.map((cat) => (
            <CategoryGroup
              key={cat}
              title={PACKAGE_CATEGORY_LABELS[cat]}
              packages={grouped[cat]}
              lineupsById={lineupsById}
              onEdit={(pkg) => setDrawerMode({ type: 'edit', pkg })}
            />
          ))}
          <CategoryGroup
            title="Uncategorised"
            packages={uncategorised}
            lineupsById={lineupsById}
            onEdit={(pkg) => setDrawerMode({ type: 'edit', pkg })}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {bandMembersEnabled ? (
        <Tabs defaultValue="packages">
          <TabsList>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="lineups">Lineups</TabsTrigger>
          </TabsList>
          <TabsContent value="packages" className="pt-4">{packagesPanel}</TabsContent>
          <TabsContent value="lineups" className="pt-4"><LineupsTab /></TabsContent>
        </Tabs>
      ) : (
        packagesPanel
      )}

      {drawerMode && (
        <PackageDrawer
          mode={drawerMode}
          open={drawerMode != null}
          onClose={() => setDrawerMode(null)}
        />
      )}
    </div>
  );
}
