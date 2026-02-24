import { useState } from 'react';
import { DOCUMENT_TYPES, type DocumentType } from '@ssm/shared';
import { Modal, Button, Input, TextArea, Select } from '@/components/ui';

const DOC_TYPE_OPTIONS = DOCUMENT_TYPES.map((t) => ({
  value: t,
  label: t.replace(/_/g, ' '),
}));

interface AddDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: { documentType: DocumentType; title: string; description?: string | null; issuedDate?: string | null; expiryDate?: string | null }) => void;
  loading?: boolean;
}

export function AddDocumentModal({ open, onClose, onAdd, loading }: AddDocumentModalProps) {
  const [documentType, setDocumentType] = useState<string>('CERTIFICATE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSubmit = () => {
    if (!title) return;
    onAdd({
      documentType: documentType as DocumentType,
      title,
      description: description || null,
      issuedDate: issuedDate || null,
      expiryDate: expiryDate || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Adaugă document" size="md">
      <div className="space-y-4">
        <Select
          label="Tip document"
          options={DOC_TYPE_OPTIONS}
          value={documentType}
          onChange={setDocumentType}
        />
        <Input
          label="Titlu"
          placeholder="Denumirea documentului..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextArea
          label="Descriere (opțional)"
          placeholder="Detalii..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data emiterii"
            type="date"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
          />
          <Input
            label="Data expirării"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button loading={loading} onClick={handleSubmit} disabled={!title}>
            Adaugă
          </Button>
        </div>
      </div>
    </Modal>
  );
}
