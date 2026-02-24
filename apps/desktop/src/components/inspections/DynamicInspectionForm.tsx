import { useState } from 'react';
import type { TemplateStructure, InspectionItemInput, Severity } from '@ssm/shared';
import { Card, Button, Select, TextArea, Input } from '@/components/ui';
import { SeverityPicker } from '@/components/forms/SeverityPicker';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicInspectionFormProps {
  structure: TemplateStructure;
  initialItems?: InspectionItemInput[];
  onSubmit: (items: InspectionItemInput[]) => void;
  onSaveDraft?: (items: InspectionItemInput[]) => void;
  submitting?: boolean;
}

type ItemState = Record<string, InspectionItemInput>;

function buildInitialState(structure: TemplateStructure, initial?: InspectionItemInput[]): ItemState {
  const state: ItemState = {};
  const existingMap = new Map(
    (initial ?? []).map((i) => [`${i.sectionId}-${i.questionId}`, i]),
  );
  for (const section of structure.sections) {
    for (const q of section.questions) {
      const key = `${section.id}-${q.id}`;
      const existing = existingMap.get(key);
      state[key] = existing ?? {
        sectionId: section.id,
        questionId: q.id,
        answerType: q.type,
        answerBool: null,
        answerText: null,
        answerNumber: null,
        isCompliant: null,
        severity: q.defaultSeverity,
        notes: null,
      };
    }
  }
  return state;
}

export function DynamicInspectionForm({ structure, initialItems, onSubmit, onSaveDraft, submitting }: DynamicInspectionFormProps) {
  const [items, setItems] = useState<ItemState>(() => buildInitialState(structure, initialItems));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(structure.sections.map((s) => s.id)),
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateItem = (key: string, patch: Partial<InspectionItemInput>) => {
    setItems((prev) => {
      const current = prev[key];
      if (!current) return prev;
      return { ...prev, [key]: { ...current, ...patch } as InspectionItemInput };
    });
  };

  const collectItems = () => Object.values(items);

  return (
    <div className="space-y-4">
      {structure.sections.map((section) => {
        const expanded = expandedSections.has(section.id);
        return (
          <Card key={section.id} className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">
                {section.title} ({section.questions.length})
              </span>
              {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expanded && (
              <div className="divide-y divide-gray-100">
                {section.questions.map((q) => {
                  const key = `${section.id}-${q.id}`;
                  const item = items[key];
                  if (!item) return null;
                  return (
                    <div key={q.id} className="px-5 py-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-gray-800 font-medium">{q.text}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">Risc: {q.riskScore}</span>
                      </div>

                      {q.type === 'YES_NO' && (
                        <div className="flex gap-2">
                          {[
                            { val: true, label: 'Da' },
                            { val: false, label: 'Nu' },
                          ].map((opt) => (
                            <button
                              key={String(opt.val)}
                              type="button"
                              onClick={() => updateItem(key, {
                                answerBool: opt.val,
                                isCompliant: opt.val,
                              })}
                              className={cn(
                                'px-4 py-1.5 rounded-lg text-sm font-medium border transition-all',
                                item.answerBool === opt.val
                                  ? opt.val
                                    ? 'bg-success-50 border-success-300 text-success-700'
                                    : 'bg-danger-50 border-danger-300 text-danger-700'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300',
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'TEXT' && (
                        <Input
                          placeholder="Răspuns..."
                          value={item.answerText ?? ''}
                          onChange={(e) => updateItem(key, { answerText: e.target.value })}
                        />
                      )}

                      {q.type === 'NUMBER' && (
                        <Input
                          type="number"
                          placeholder="Valoare..."
                          value={item.answerNumber?.toString() ?? ''}
                          onChange={(e) => updateItem(key, { answerNumber: e.target.value ? Number(e.target.value) : null })}
                        />
                      )}

                      {q.type === 'SELECT' && q.options && (
                        <Select
                          options={q.options.map((o) => ({ value: o, label: o }))}
                          value={item.answerText ?? ''}
                          onChange={(val) => updateItem(key, { answerText: val })}
                          placeholder="Selectează..."
                        />
                      )}

                      {item.isCompliant === false && (
                        <SeverityPicker
                          value={item.severity as Severity ?? 'MEDIUM'}
                          onChange={(sev) => updateItem(key, { severity: sev })}
                          label="Severitate neconformitate"
                        />
                      )}

                      <TextArea
                        placeholder="Note..."
                        value={item.notes ?? ''}
                        onChange={(e) => updateItem(key, { notes: e.target.value || null })}
                        rows={2}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      <div className="flex gap-3 pt-4">
        {onSaveDraft && (
          <Button variant="outline" onClick={() => onSaveDraft(collectItems())} disabled={submitting}>
            Salvează ciornă
          </Button>
        )}
        <Button variant="primary" loading={submitting} onClick={() => onSubmit(collectItems())}>
          Trimite inspecția
        </Button>
      </div>
    </div>
  );
}
