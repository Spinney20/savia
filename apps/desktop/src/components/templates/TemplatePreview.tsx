import type { TemplateStructure } from '@ssm/shared';
import { Card, Badge } from '@/components/ui';

const TYPE_LABELS: Record<string, string> = {
  YES_NO: 'Da/Nu',
  TEXT: 'Text',
  NUMBER: 'Număr',
  SELECT: 'Selecție',
  PHOTO: 'Foto',
};

interface TemplatePreviewProps {
  structure: TemplateStructure;
}

export function TemplatePreview({ structure }: TemplatePreviewProps) {
  return (
    <div className="space-y-4">
      {structure.sections.map((section) => (
        <Card key={section.id}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    {q.text}
                    {q.required && <span className="text-danger ml-1">*</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge label={TYPE_LABELS[q.type] ?? q.type} color="text-gray-500" bgColor="bg-gray-100" />
                    <span className="text-xs text-gray-400">Risc: {q.riskScore}</span>
                    <span className="text-xs text-gray-400">Sev: {q.defaultSeverity}</span>
                    {q.photoRequired && <span className="text-xs text-primary">Foto</span>}
                  </div>
                  {q.type === 'SELECT' && q.options && (
                    <p className="text-xs text-gray-400 mt-1">Opțiuni: {q.options.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
