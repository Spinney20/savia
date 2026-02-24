import { useState } from 'react';
import type { AssignIssueInput } from '@ssm/shared';
import { useEmployees } from '@/hooks/use-employees';
import { Modal, Button, Select, Input, TextArea } from '@/components/ui';

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (input: AssignIssueInput) => void;
  loading?: boolean;
}

export function AssignmentModal({ open, onClose, onAssign, loading }: AssignmentModalProps) {
  const [assignedToUuid, setAssignedToUuid] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  const { data: employeesData } = useEmployees({ limit: 100 });
  const employees = employeesData?.data ?? [];
  const options = employees.map((e) => ({
    value: e.uuid,
    label: `${e.firstName} ${e.lastName}`,
  }));

  const handleSubmit = () => {
    if (!assignedToUuid) return;
    onAssign({
      assignedToUuid,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      notes: notes || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Atribuie problema" size="md">
      <div className="space-y-4">
        <Select
          label="Atribuie către"
          placeholder="Selectează angajatul..."
          options={options}
          value={assignedToUuid}
          onChange={setAssignedToUuid}
        />

        <Input
          label="Termen limită (opțional)"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <TextArea
          label="Note (opțional)"
          placeholder="Instrucțiuni suplimentare..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button loading={loading} onClick={handleSubmit} disabled={!assignedToUuid}>
            Atribuie
          </Button>
        </div>
      </div>
    </Modal>
  );
}
