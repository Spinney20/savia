import { useState } from 'react';
import { ROLES, type Role, ROLE_LABELS_RO } from '@ssm/shared';
import { Modal, Button, Input, Select } from '@/components/ui';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { email: string; role: Role }) => void;
  defaultEmail?: string;
  loading?: boolean;
}

const ROLE_OPTIONS = ROLES.map((r) => ({
  value: r,
  label: ROLE_LABELS_RO[r],
}));

export function CreateUserModal({ open, onClose, onCreate, defaultEmail, loading }: CreateUserModalProps) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [role, setRole] = useState<string>('MUNCITOR');

  const handleSubmit = () => {
    if (!email) return;
    onCreate({ email, role: role as Role });
  };

  return (
    <Modal open={open} onClose={onClose} title="Creare cont utilizator" size="md">
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@exemplu.ro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Rol"
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
        />
        <p className="text-xs text-gray-500">
          Un email de activare va fi trimis la adresa specificată.
        </p>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button loading={loading} onClick={handleSubmit} disabled={!email}>
            Creează cont
          </Button>
        </div>
      </div>
    </Modal>
  );
}
