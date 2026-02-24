import { PageHeader } from '@/components/layout/PageHeader';
import { Card, EmptyState } from '@/components/ui';
import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Gestionare utilizatori"
        subtitle="Administrați conturile utilizatorilor din sistem."
        className="mb-6"
      />

      <Card>
        <EmptyState
          title="Utilizatori"
          description="Conturile utilizatorilor se creează din secțiunea Angajați → Creează cont."
          icon={UserCog}
        />
      </Card>
    </div>
  );
}
