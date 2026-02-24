import { differenceInDays, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiringDoc {
  title: string;
  employeeName: string;
  expiryDate: string;
}

interface ExpiringDocsListProps {
  documents: ExpiringDoc[];
}

export function ExpiringDocsList({ documents }: ExpiringDocsListProps) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Documente care expiră</h3>
        <p className="text-sm text-gray-500">Niciun document nu expiră curând.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Documente care expiră</h3>
      <div className="space-y-2">
        {documents.slice(0, 8).map((doc) => {
          const days = differenceInDays(new Date(doc.expiryDate), new Date());
          const isExpired = days < 0;
          const isCritical = days >= 0 && days <= 7;

          return (
            <div key={`${doc.employeeName}-${doc.title}`} className="flex items-center gap-3 py-1.5">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                isExpired ? 'bg-danger-50' : isCritical ? 'bg-warning-50' : 'bg-gray-50',
              )}>
                {isExpired || isCritical ? (
                  <AlertTriangle size={14} className={isExpired ? 'text-danger' : 'text-warning-600'} />
                ) : (
                  <FileText size={14} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.employeeName}</p>
              </div>
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                isExpired ? 'text-danger' : isCritical ? 'text-warning-600' : 'text-gray-500',
              )}>
                {isExpired
                  ? `Expirat ${Math.abs(days)}z`
                  : days === 0
                    ? 'Azi'
                    : `${days}z`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
