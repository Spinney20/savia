import { useState } from 'react';
import type { TemplateQuestion, QuestionType, Severity } from '@ssm/shared';
import { QUESTION_TYPES, SEVERITY_LEVELS } from '@ssm/shared';
import { Input, Select, Checkbox } from '@/components/ui';
import { Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  YES_NO: 'Da/Nu',
  TEXT: 'Text',
  NUMBER: 'Număr',
  SELECT: 'Selecție',
  PHOTO: 'Foto',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Scăzut',
  MEDIUM: 'Mediu',
  HIGH: 'Ridicat',
  CRITICAL: 'Critic',
};

interface QuestionEditorProps {
  question: TemplateQuestion;
  onChange: (question: TemplateQuestion) => void;
  onRemove: () => void;
}

export function QuestionEditor({ question, onChange, onRemove }: QuestionEditorProps) {
  const [newOption, setNewOption] = useState('');

  const typeOptions = QUESTION_TYPES.map((t) => ({ value: t, label: QUESTION_TYPE_LABELS[t] }));
  const severityOptions = SEVERITY_LEVELS.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }));

  const addOption = () => {
    if (!newOption.trim()) return;
    onChange({ ...question, options: [...(question.options ?? []), newOption.trim()] });
    setNewOption('');
  };

  const removeOption = (index: number) => {
    onChange({ ...question, options: (question.options ?? []).filter((_, i) => i !== index) });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="flex items-start gap-2">
        <Input
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          placeholder="Textul întrebării..."
          className="flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-danger transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Select
          label="Tip"
          options={typeOptions}
          value={question.type}
          onChange={(val) => onChange({ ...question, type: val as QuestionType })}
        />
        <Select
          label="Severitate"
          options={severityOptions}
          value={question.defaultSeverity}
          onChange={(val) => onChange({ ...question, defaultSeverity: val as Severity })}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Scor risc (1-10)</label>
          <input
            type="range"
            min={1}
            max={10}
            value={question.riskScore}
            onChange={(e) => onChange({ ...question, riskScore: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <span className="text-xs text-gray-500 text-center block">{question.riskScore}</span>
        </div>
        <div className="space-y-2 pt-6">
          <Checkbox
            label="Obligatoriu"
            checked={question.required}
            onChange={(e) => onChange({ ...question, required: e.target.checked })}
          />
          <Checkbox
            label="Foto necesar"
            checked={question.photoRequired}
            onChange={(e) => onChange({ ...question, photoRequired: e.target.checked })}
          />
        </div>
      </div>

      {question.type === 'SELECT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Opțiuni</label>
          <div className="space-y-1.5 mb-2">
            {(question.options ?? []).map((opt, i) => (
              <div key={`${opt}-${i}`} className="flex items-center gap-2">
                <span className="text-sm text-gray-700 flex-1 bg-gray-50 px-3 py-1.5 rounded-lg">{opt}</span>
                <button type="button" onClick={() => removeOption(i)} className="text-gray-400 hover:text-danger">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Adaugă opțiune..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              className="flex-1"
            />
            <button
              type="button"
              onClick={addOption}
              className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
