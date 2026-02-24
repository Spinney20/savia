import { View, ScrollView } from 'react-native';
import type { TemplateStructure, InspectionItemInput } from '@ssm/shared';
import { Text, Card, Input, TextArea, Switch, Button } from '@/components/ui';
import { SeverityPicker } from './SeverityPicker';
import { useState } from 'react';

interface DynamicInspectionFormProps {
  structure: TemplateStructure;
  initialItems?: InspectionItemInput[];
  onSubmit: (items: InspectionItemInput[]) => void;
  onSaveDraft?: (items: InspectionItemInput[]) => void;
  submitting?: boolean;
}

export function DynamicInspectionForm({
  structure,
  initialItems = [],
  onSubmit,
  onSaveDraft,
  submitting = false,
}: DynamicInspectionFormProps) {
  const [answers, setAnswers] = useState<Record<string, Partial<InspectionItemInput>>>(() => {
    const map: Record<string, Partial<InspectionItemInput>> = {};
    for (const item of initialItems) {
      map[`${item.sectionId}_${item.questionId}`] = item;
    }
    return map;
  });

  const getKey = (sectionId: string, questionId: string) => `${sectionId}_${questionId}`;

  const updateAnswer = (sectionId: string, questionId: string, update: Partial<InspectionItemInput>) => {
    const key = getKey(sectionId, questionId);
    setAnswers((prev) => ({
      ...prev,
      [key]: { ...prev[key], sectionId, questionId, ...update },
    }));
  };

  const collectItems = (): InspectionItemInput[] => {
    return Object.values(answers).filter(
      (a): a is InspectionItemInput => !!a.sectionId && !!a.questionId && !!a.answerType,
    );
  };

  const totalQuestions = structure.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.values(answers).filter(
    (a) => !!a.answerType,
  ).length;

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-32">
      {structure.sections.map((section) => (
        <View key={section.id} className="mb-4">
          <View className="px-4 py-3 bg-primary-50">
            <Text variant="h3" className="text-primary">{section.title}</Text>
          </View>

          {section.questions.map((q) => {
            const key = getKey(section.id, q.id);
            const answer = answers[key];

            return (
              <Card key={q.id} className="mx-4 mt-3">
                <Text variant="body" className="font-medium mb-3">
                  {q.text}
                  {q.required && <Text className="text-danger"> *</Text>}
                </Text>

                {q.type === 'YES_NO' && (
                  <View className="gap-3">
                    <Switch
                      label="Conform"
                      value={answer?.answerBool === true}
                      onValueChange={(val) =>
                        updateAnswer(section.id, q.id, {
                          answerType: 'YES_NO',
                          answerBool: val,
                          isCompliant: val,
                          severity: val ? null : (answer?.severity ?? q.defaultSeverity),
                        })
                      }
                    />
                    {answer?.answerBool === false && (
                      <SeverityPicker
                        label="Severitate"
                        value={answer?.severity ?? undefined}
                        onChange={(sev) => updateAnswer(section.id, q.id, { severity: sev as any })}
                      />
                    )}
                  </View>
                )}

                {q.type === 'TEXT' && (
                  <TextArea
                    placeholder="Răspunsul dvs..."
                    value={answer?.answerText ?? ''}
                    onChangeText={(text) =>
                      updateAnswer(section.id, q.id, { answerType: 'TEXT', answerText: text })
                    }
                    rows={2}
                  />
                )}

                {q.type === 'NUMBER' && (
                  <Input
                    placeholder="Introduceți valoarea"
                    keyboardType="numeric"
                    value={answer?.answerNumber?.toString() ?? ''}
                    onChangeText={(text) =>
                      updateAnswer(section.id, q.id, {
                        answerType: 'NUMBER',
                        answerNumber: text ? parseFloat(text) : null,
                      })
                    }
                  />
                )}

                {q.type === 'SELECT' && q.options && (
                  <View className="flex-row flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <Button
                        key={opt}
                        variant={answer?.answerText === opt ? 'primary' : 'outline'}
                        size="sm"
                        onPress={() =>
                          updateAnswer(section.id, q.id, { answerType: 'SELECT', answerText: opt })
                        }
                      >
                        {opt}
                      </Button>
                    ))}
                  </View>
                )}

                {/* Notes field for any question */}
                <Input
                  placeholder="Observații (opțional)"
                  value={answer?.notes ?? ''}
                  onChangeText={(text) => updateAnswer(section.id, q.id, { notes: text || null })}
                  className="mt-2"
                />
              </Card>
            );
          })}
        </View>
      ))}

      {/* Bottom actions */}
      <View className="px-4 gap-3 mt-4">
        <Text variant="bodySmall" muted className="text-center">
          Completat {answeredCount}/{totalQuestions} întrebări
        </Text>
        <Button
          variant="primary"
          size="lg"
          loading={submitting}
          onPress={() => onSubmit(collectItems())}
        >
          Trimite inspecția
        </Button>
        {onSaveDraft && (
          <Button
            variant="outline"
            size="md"
            onPress={() => onSaveDraft(collectItems())}
          >
            Salvează ciornă
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
