import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { EmployeeSiteAssignmentDto } from '@ssm/shared';
import { Card, Button, ConfirmDialog } from '@/components/ui';
import { MapPin, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores';

interface SiteAssignmentsListProps {
  assignments: EmployeeSiteAssignmentDto[];
  onRemove: (siteUuid: string) => void;
  removing?: boolean;
}

export function SiteAssignmentsList({ assignments, onRemove, removing }: SiteAssignmentsListProps) {
  const user = useAuthStore((s) => s.user);
  const siteMap = new Map((user?.allocatedSites ?? []).map((s) => [s.uuid, s.name]));
  const [confirmSite, setConfirmSite] = useState<string | null>(null);

  const active = assignments.filter((a) => !a.removedAt);

  if (active.length === 0) {
    return <p className="text-sm text-gray-500">Niciun șantier atribuit.</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {active.map((a) => (
          <Card key={a.siteUuid} className="!p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <MapPin size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {siteMap.get(a.siteUuid) ?? a.siteUuid}
                  </p>
                  <p className="text-xs text-gray-400">
                    Din {format(new Date(a.assignedAt), 'dd MMM yyyy', { locale: ro })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => setConfirmSite(a.siteUuid)}
              />
            </div>
            {a.notes && <p className="text-xs text-gray-500 mt-2 ml-11">{a.notes}</p>}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmSite}
        onClose={() => setConfirmSite(null)}
        onConfirm={() => {
          if (confirmSite) onRemove(confirmSite);
          setConfirmSite(null);
        }}
        title="Elimină șantierul"
        description="Sigur doriți să eliminați acest șantier?"
        confirmLabel="Elimină"
        loading={removing}
      />
    </>
  );
}
