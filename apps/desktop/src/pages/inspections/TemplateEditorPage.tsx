import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TemplateStructure, TemplateSection } from '@ssm/shared';
import { useTemplate, useUpdateTemplate, usePublishVersion } from '@/hooks/use-templates';
import { SectionEditor } from '@/components/templates/SectionEditor';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { JsonViewToggle } from '@/components/templates/JsonViewToggle';
import { VersionHistoryList } from '@/components/templates/VersionHistoryList';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Tabs, Button, Input, TextArea, Spinner, ErrorState } from '@/components/ui';
import { Plus, Save, Upload } from 'lucide-react';

export default function TemplateEditorPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: template, isLoading, isError, refetch } = useTemplate(uuid!);
  const updateTemplate = useUpdateTemplate(uuid!);
  const publishVersion = usePublishVersion(uuid!);

  const [tab, setTab] = useState('editor');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [structure, setStructure] = useState<TemplateStructure>({ sections: [] });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      if (template.currentStructure) {
        setStructure(template.currentStructure);
      }
    }
  }, [template]);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !template) return <ErrorState onRetry={refetch} className="mt-16" />;

  const addSection = () => {
    const newSection: TemplateSection = {
      id: crypto.randomUUID().slice(0, 8),
      title: '',
      order: structure.sections.length,
      questions: [],
    };
    setStructure({ sections: [...structure.sections, newSection] });
  };

  const updateSection = (index: number, section: TemplateSection) => {
    const sections = [...structure.sections];
    sections[index] = section;
    setStructure({ sections });
  };

  const removeSection = (index: number) => {
    setStructure({
      sections: structure.sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    });
  };

  const handleSave = () => {
    updateTemplate.mutate({ name, description: description || null });
  };

  const handlePublish = () => {
    publishVersion.mutate(
      { structure, changeNotes: changeNotes || null },
      { onSuccess: () => { setChangeNotes(''); refetch(); } },
    );
  };

  const tabs = [
    { id: 'editor', label: 'Editor' },
    { id: 'preview', label: 'Previzualizare' },
    { id: 'versions', label: `Versiuni (${template.versions?.length ?? 0})` },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={template.name}
        subtitle={`v${template.currentVersionNumber ?? 0} — ${template.isActive ? 'Activ' : 'Inactiv'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Save}
              loading={updateTemplate.isPending}
              onClick={handleSave}
            >
              Salvează
            </Button>
            <Button
              icon={Upload}
              loading={publishVersion.isPending}
              onClick={handlePublish}
              disabled={structure.sections.length === 0}
            >
              Publică versiune
            </Button>
          </div>
        }
        className="mb-6"
      />

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-6" />

      {tab === 'editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            {structure.sections.map((section, i) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(s) => updateSection(i, s)}
                onRemove={() => removeSection(i)}
              />
            ))}
            <Button variant="secondary" icon={Plus} onClick={addSection} type="button">
              Adaugă secțiune
            </Button>

            <JsonViewToggle structure={structure} />
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalii șablon</h3>
              <div className="space-y-3">
                <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} />
                <TextArea
                  label="Descriere"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Note publicare</h3>
              <TextArea
                placeholder="Ce s-a schimbat în această versiune..."
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                rows={3}
              />
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Statistici</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{structure.sections.length} secțiuni</p>
                <p>{structure.sections.reduce((s, sec) => s + sec.questions.length, 0)} întrebări</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'preview' && (
        structure.sections.length > 0 ? (
          <TemplatePreview structure={structure} />
        ) : (
          <p className="text-sm text-gray-500">Adăugați secțiuni pentru a vedea previzualizarea.</p>
        )
      )}

      {tab === 'versions' && (
        <VersionHistoryList versions={template.versions ?? []} />
      )}
    </div>
  );
}
