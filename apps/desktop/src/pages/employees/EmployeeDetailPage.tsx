import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Briefcase, Phone, Mail, Calendar, MapPin, UserPlus, Plus, Pencil, Trash2,
} from 'lucide-react';
import {
  useEmployee, useDeleteEmployee,
  useEmployeeSites, useAssignSite, useRemoveSite,
  useEmployeeDocuments, useCreateDocument,
  useCreateUserForEmployee,
} from '@/hooks/use-employees';
import { SiteAssignmentsList } from '@/components/employees/SiteAssignmentsList';
import { DocumentsList } from '@/components/employees/DocumentsList';
import { CreateUserModal } from '@/components/employees/CreateUserModal';
import { AddDocumentModal } from '@/components/employees/AddDocumentModal';
import { AssignSiteModal } from '@/components/employees/AssignSiteModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Tabs, StatusBadge, Avatar, Button, Spinner, ErrorState, ConfirmDialog } from '@/components/ui';
import { usePermission } from '@/lib/permissions';

export default function EmployeeDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading, isError, refetch } = useEmployee(uuid!);
  const { data: sitesData } = useEmployeeSites(uuid!);
  const { data: docsData } = useEmployeeDocuments(uuid!);
  const deleteMut = useDeleteEmployee();
  const assignSiteMut = useAssignSite(uuid!);
  const removeSiteMut = useRemoveSite(uuid!);
  const createDocMut = useCreateDocument(uuid!);
  const createUserMut = useCreateUserForEmployee(uuid!);
  const canManage = usePermission('employees', 'update');

  const [tab, setTab] = useState('details');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [siteModalOpen, setSiteModalOpen] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !employee) return <ErrorState onRetry={refetch} className="mt-16" />;

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const sites = sitesData ?? [];
  const docs = docsData ?? [];

  const tabs = [
    { id: 'details', label: 'Detalii' },
    { id: 'sites', label: `Șantiere (${sites.filter((s: any) => !s.removedAt).length})` },
    { id: 'documents', label: `Documente (${docs.length})` },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={fullName}
        subtitle={employee.jobTitle ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button variant="outline" icon={Pencil} onClick={() => navigate(`/employees/${uuid}/edit`)}>
                  Editează
                </Button>
                {!employee.hasUserAccount && (
                  <Button variant="secondary" icon={UserPlus} onClick={() => setUserModalOpen(true)}>
                    Creare cont
                  </Button>
                )}
              </>
            )}
            <Button icon={Trash2} variant="ghost" onClick={() => setDeleteOpen(true)} />
          </div>
        }
        className="mb-6"
      />

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-6" />

      {tab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={fullName} size={56} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={employee.status} type="employee" />
                  {employee.hasUserAccount && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary">
                      Cont activ
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {employee.jobTitle && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={15} className="text-gray-400" />
                  <span className="text-gray-600">{employee.jobTitle}</span>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={15} className="text-gray-400" />
                  <span className="text-gray-600">{employee.phone}</span>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={15} className="text-gray-400" />
                  <span className="text-gray-600">{employee.email}</span>
                </div>
              )}
              {employee.hireDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={15} className="text-gray-400" />
                  <span className="text-gray-600">
                    Angajat din {format(new Date(employee.hireDate), 'dd MMMM yyyy', { locale: ro })}
                  </span>
                </div>
              )}
              {employee.terminationDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={15} className="text-danger" />
                  <span className="text-danger">
                    Încetat: {format(new Date(employee.terminationDate), 'dd MMM yyyy', { locale: ro })}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informații</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Status: {employee.status}</p>
              <p>Cont utilizator: {employee.hasUserAccount ? 'Da' : 'Nu'}</p>
              <p>Creat: {format(new Date(employee.createdAt), 'dd MMM yyyy', { locale: ro })}</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'sites' && (
        <div>
          {canManage && (
            <div className="mb-4">
              <Button icon={Plus} variant="secondary" size="sm" onClick={() => setSiteModalOpen(true)}>
                Atribuie șantier
              </Button>
            </div>
          )}
          <SiteAssignmentsList
            assignments={sites}
            onRemove={(siteUuid) => removeSiteMut.mutate(siteUuid)}
            removing={removeSiteMut.isPending}
          />
        </div>
      )}

      {tab === 'documents' && (
        <div>
          {canManage && (
            <div className="mb-4">
              <Button icon={Plus} variant="secondary" size="sm" onClick={() => setDocModalOpen(true)}>
                Adaugă document
              </Button>
            </div>
          )}
          <DocumentsList documents={docs} />
        </div>
      )}

      <CreateUserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onCreate={(input) => createUserMut.mutate(input, { onSuccess: () => { setUserModalOpen(false); refetch(); } })}
        defaultEmail={employee.email ?? undefined}
        loading={createUserMut.isPending}
      />

      <AddDocumentModal
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        onAdd={(input) => createDocMut.mutate(input, { onSuccess: () => setDocModalOpen(false) })}
        loading={createDocMut.isPending}
      />

      <AssignSiteModal
        open={siteModalOpen}
        onClose={() => setSiteModalOpen(false)}
        onAssign={(input) => assignSiteMut.mutate(input, { onSuccess: () => setSiteModalOpen(false) })}
        loading={assignSiteMut.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate(uuid!, { onSuccess: () => navigate('/employees') })}
        title="Șterge angajatul"
        description="Această acțiune este ireversibilă. Sigur doriți să ștergeți angajatul?"
        confirmLabel="Șterge"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
