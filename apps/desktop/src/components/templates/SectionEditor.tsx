import { useState } from 'react';
import type { TemplateSection, TemplateQuestion } from '@ssm/shared';
import { QuestionEditor } from './QuestionEditor';
import { Card, Button, Input } from '@/components/ui';
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionEditorProps {
  section: TemplateSection;
  onChange: (section: TemplateSection) => void;
  onRemove: () => void;
}

export function SectionEditor({ section, onChange, onRemove }: SectionEditorProps) {
  const [expanded, setExpanded] = useState(true);

  const updateTitle = (title: string) => onChange({ ...section, title });

  const addQuestion = () => {
    const newQuestion: TemplateQuestion = {
      id: crypto.randomUUID().slice(0, 8),
      text: '',
      type: 'YES_NO',
      required: true,
      riskScore: 5,
      defaultSeverity: 'MEDIUM',
      photoRequired: false,
      order: section.questions.length,
    };
    onChange({ ...section, questions: [...section.questions, newQuestion] });
  };

  const updateQuestion = (index: number, question: TemplateQuestion) => {
    const questions = [...section.questions];
    questions[index] = question;
    onChange({ ...section, questions });
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...section,
      questions: section.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })),
    });
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <GripVertical size={16} className="text-gray-300 cursor-grab" />
        <Input
          value={section.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Titlu secțiune..."
          className="!rounded-lg !py-1.5 !text-sm font-semibold flex-1"
        />
        <span className="text-xs text-gray-400">{section.questions.length} întrebări</span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-danger transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {section.questions.map((question, i) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onChange={(q) => updateQuestion(i, q)}
              onRemove={() => removeQuestion(i)}
            />
          ))}
          <Button variant="ghost" size="sm" icon={Plus} onClick={addQuestion} type="button">
            Adaugă întrebare
          </Button>
        </div>
      )}
    </Card>
  );
}
