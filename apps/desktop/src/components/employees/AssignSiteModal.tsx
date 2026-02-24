import { useState } from 'react';
import { Modal, Button, TextArea } from '@/components/ui';
import { SitePicker } from '@/components/forms/SitePicker';

interface AssignSiteModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (input: { siteUuid: string; notes?: string | null }) => void;
  loading?: boolean;
}

export function AssignSiteModal({ open, onClose, onAssign, loading }: AssignSiteModalProps) {
  const [siteUuid, setSiteUuid] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!siteUuid) return;
    onAssign({ siteUuid, notes: notes || null });
  };

  return (
    <Modal open={open} onClose={onClose} title="Atribuie șantier" size="md">
      <div className="space-y-4">
        <SitePicker value={siteUuid} onChange={setSiteUuid} />
        <TextArea
          label="Note (opțional)"
          placeholder="Note suplimentare..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button loading={loading} onClick={handleSubmit} disabled={!siteUuid}>
            Atribuie
          </Button>
        </div>
      </div>
    </Modal>
  );
}
