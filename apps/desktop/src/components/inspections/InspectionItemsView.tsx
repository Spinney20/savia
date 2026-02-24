import type { InspectionItemDto, TemplateStructure } from '@ssm/shared';
import { Card, SeverityBadge } from '@/components/ui';
import { CheckCircle2, XCircle, Minus } from 'lucide-react';

interface InspectionItemsViewProps {
  items: InspectionItemDto[];
  structure: TemplateStructure;
}

export function InspectionItemsView({ items, structure }: InspectionItemsViewProps) {
  const itemMap = new Map(items.map((item) => [`${item.sectionId}-${item.questionId}`, item]));

  return (
    <div className="space-y-6">
      {structure.sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.questions.map((question) => {
              const item = itemMap.get(`${section.id}-${question.id}`);
              return (
                <Card key={question.id} className="!p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item?.isCompliant === true && <CheckCircle2 size={18} className="text-success" />}
                      {item?.isCompliant === false && <XCircle size={18} className="text-danger" />}
                      {item?.isCompliant == null && <Minus size={18} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{question.text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {item?.answerBool != null && (
                          <span className="text-xs text-gray-500">
                            {item.answerBool ? 'Da' : 'Nu'}
                          </span>
                        )}
                        {item?.answerText && (
                          <span className="text-xs text-gray-500 truncate">{item.answerText}</span>
                        )}
                        {item?.answerNumber != null && (
                          <span className="text-xs text-gray-500">{item.answerNumber}</span>
                        )}
                        {item?.severity && <SeverityBadge severity={item.severity} />}
                      </div>
                      {item?.notes && (
                        <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      Risc: {item?.riskScore ?? question.riskScore}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
