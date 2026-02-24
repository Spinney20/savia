import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { EmployeeDocumentDto } from '@ssm/shared';
import { Card, Badge } from '@/components/ui';
import { FileText, AlertCircle } from 'lucide-react';

const DOC_TYPE_LABELS: Record<string, string> = {
  MEDICAL_RECORD: 'Fișa medicală',
  CERTIFICATE: 'Certificat',
  CONTRACT: 'Contract',
  ID_DOCUMENT: 'Act de identitate',
  TRAINING_RECORD: 'Fișa de instruire',
  OTHER: 'Altele',
};

interface DocumentsListProps {
  documents: EmployeeDocumentDto[];
}

export function DocumentsList({ documents }: DocumentsListProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-gray-500">Niciun document.</p>;
  }

  const now = new Date();

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const isExpired = doc.expiryDate && new Date(doc.expiryDate) < now;
        const isExpiring = doc.expiryDate && !isExpired &&
          (new Date(doc.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30;

        return (
          <Card key={doc.uuid} className="!p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <Badge
                    label={DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                    color="text-gray-600"
                    bgColor="bg-gray-100"
                  />
                </div>
                {doc.description && (
                  <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {doc.issuedDate && (
                    <span>Emis: {format(new Date(doc.issuedDate), 'dd MMM yyyy', { locale: ro })}</span>
                  )}
                  {doc.expiryDate && (
                    <span className={isExpired ? 'text-danger' : isExpiring ? 'text-warning-600' : ''}>
                      {isExpired && <AlertCircle size={11} className="inline mr-0.5" />}
                      Expiră: {format(new Date(doc.expiryDate), 'dd MMM yyyy', { locale: ro })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
