import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { InspectionTemplateVersionDto } from '@ssm/shared';
import { Card, Badge } from '@/components/ui';
import { History } from 'lucide-react';

interface VersionHistoryListProps {
  versions: InspectionTemplateVersionDto[];
}

export function VersionHistoryList({ versions }: VersionHistoryListProps) {
  if (versions.length === 0) {
    return <p className="text-sm text-gray-500">Nicio versiune publicată.</p>;
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <Card key={v.versionNumber} className="!p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <History size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">v{v.versionNumber}</span>
                {v.publishedAt ? (
                  <Badge label="Publicat" color="text-success-600" bgColor="bg-success-50" />
                ) : (
                  <Badge label="Ciornă" color="text-gray-500" bgColor="bg-gray-100" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400">
                  {v.publishedAt
                    ? format(new Date(v.publishedAt), 'dd MMM yyyy, HH:mm', { locale: ro })
                    : format(new Date(v.createdAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                </span>
                <span className="text-xs text-gray-400">
                  {v.structure.sections.length} secțiuni,{' '}
                  {v.structure.sections.reduce((s, sec) => s + sec.questions.length, 0)} întrebări
                </span>
              </div>
              {v.changeNotes && (
                <p className="text-xs text-gray-500 mt-1">{v.changeNotes}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
