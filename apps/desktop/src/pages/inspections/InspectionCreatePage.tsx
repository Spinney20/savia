import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InspectionItemInput } from '@ssm/shared';
import { useTemplates, useTemplate } from '@/hooks/use-templates';
import { useCreateInspection } from '@/hooks/use-inspections';
import { DynamicInspectionForm } from '@/components/inspections/DynamicInspectionForm';
import { SitePicker } from '@/components/forms/SitePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Select, Spinner } from '@/components/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type Step = 'setup' | 'form';

export default function InspectionCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('setup');
  const [siteUuid, setSiteUuid] = useState('');
  const [templateUuid, setTemplateUuid] = useState('');
  const createInspection = useCreateInspection();

  const { data: templatesData } = useTemplates({ limit: 50 });
  const templates = templatesData?.data ?? [];
  const { data: templateDetail, isLoading: loadingTemplate } = useTemplate(templateUuid);

  const templateOptions = templates.map((t) => ({ value: t.uuid, label: t.name }));

  const handleSubmit = (items: InspectionItemInput[]) => {
    createInspection.mutate(
      { siteUuid, templateUuid, items },
      { onSuccess: () => navigate('/inspections') },
    );
  };

  const handleSaveDraft = (items: InspectionItemInput[]) => {
    createInspection.mutate(
      { siteUuid, templateUuid, items },
      { onSuccess: () => navigate('/inspections') },
    );
  };

  if (step === 'setup') {
    return (
      <div className="p-6 max-w-2xl">
        <PageHeader title="Inspecție nouă" className="mb-6" />

        <Card className="space-y-5">
          <SitePicker value={siteUuid} onChange={setSiteUuid} />

          <Select
            label="Șablon inspecție"
            placeholder="Selectează șablonul..."
            options={templateOptions}
            value={templateUuid}
            onChange={setTemplateUuid}
          />

          {templateDetail && (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">{templateDetail.name}</p>
              {templateDetail.description && (
                <p className="text-xs text-gray-500 mt-1">{templateDetail.description}</p>
              )}
              {templateDetail.currentStructure && (
                <p className="text-xs text-gray-400 mt-1">
                  {templateDetail.currentStructure.sections.length} secțiuni &middot;{' '}
                  {templateDetail.currentStructure.sections.reduce((s, sec) => s + sec.questions.length, 0)} întrebări
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/inspections')}>
              Înapoi
            </Button>
            <Button
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setStep('form')}
              disabled={!siteUuid || !templateUuid}
            >
              Continuă
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loadingTemplate || !templateDetail?.currentStructure) {
    return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă șablonul..." /></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title={templateDetail.name}
        subtitle="Completați inspecția"
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep('setup')}>
            Configurare
          </Button>
        }
        className="mb-6"
      />
      <DynamicInspectionForm
        structure={templateDetail.currentStructure}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        submitting={createInspection.isPending}
      />
    </div>
  );
}
