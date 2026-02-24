import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  User, Calendar, MapPin, Tag, Trash2, UserPlus,
} from 'lucide-react';
import type { IssueStatus } from '@ssm/shared';
import { ISSUE_STATUS_LABELS_RO, ISSUE_VALID_TRANSITIONS } from '@ssm/shared';
import { useIssue, useIssueComments, useCreateIssueComment, useUpdateIssueStatus, useAssignIssue, useDeleteIssue } from '@/hooks/use-issues';
import { CommentThread } from '@/components/issues/CommentThread';
import { StatusTimeline } from '@/components/issues/StatusTimeline';
import { AssignmentModal } from '@/components/issues/AssignmentModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Tabs, StatusBadge, SeverityBadge, Button, Select, Spinner, ErrorState, ConfirmDialog, Avatar } from '@/components/ui';
import { usePermission } from '@/lib/permissions';

export default function IssueDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: issue, isLoading, isError, refetch } = useIssue(uuid!);
  const { data: commentsData } = useIssueComments(uuid!);
  const comments = commentsData ?? (issue?.comments ?? []);
  const createComment = useCreateIssueComment(uuid!);
  const updateStatus = useUpdateIssueStatus(uuid!);
  const assignIssue = useAssignIssue(uuid!);
  const deleteIssue = useDeleteIssue();
  const canManage = usePermission('issues', 'update');

  const [tab, setTab] = useState('details');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !issue) return <ErrorState onRetry={refetch} className="mt-16" />;

  const nextStatuses = ISSUE_VALID_TRANSITIONS[issue.status] ?? [];
  const statusOptions = nextStatuses.map((s) => ({
    value: s,
    label: ISSUE_STATUS_LABELS_RO[s] ?? s,
  }));

  const tabs = [
    { id: 'details', label: 'Detalii' },
    { id: 'comments', label: `Comentarii (${comments.length})` },
    { id: 'history', label: 'Istoric' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={issue.title}
        subtitle={`Raportată de ${issue.reporterName}`}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Button icon={UserPlus} variant="secondary" onClick={() => setAssignOpen(true)}>
                Atribuie
              </Button>
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
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={issue.status} type="issue" />
              <SeverityBadge severity={issue.severity} />
              {issue.categoryName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  <Tag size={12} />
                  {issue.categoryName}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{issue.description}</p>

            {canManage && statusOptions.length > 0 && (
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Schimbă status:</span>
                {statusOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="sm"
                    loading={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ status: opt.value as IssueStatus }, { onSuccess: () => { refetch(); } })}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informații</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User size={15} className="text-gray-400" />
                  <span className="text-gray-600">{issue.reporterName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={15} className="text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(issue.reportedAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                  </span>
                </div>
                {issue.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={15} className="text-danger" />
                    <span className="text-danger">
                      Termen: {format(new Date(issue.deadline), 'dd MMM yyyy', { locale: ro })}
                    </span>
                  </div>
                )}
                {issue.latitude != null && issue.longitude != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={15} className="text-gray-400" />
                    <span className="text-gray-600">
                      {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {issue.assignments && issue.assignments.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Atribuiri</h3>
                <div className="space-y-3">
                  {issue.assignments.map((a) => (
                    <div key={`${a.assignedToName}-${a.assignedAt}`} className="flex items-center gap-3">
                      <Avatar name={a.assignedToName} size={28} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.assignedToName}</p>
                        <p className="text-xs text-gray-400">
                          de {a.assignedByName} &middot;{' '}
                          {format(new Date(a.assignedAt), 'dd MMM yyyy', { locale: ro })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'comments' && (
        <CommentThread
          comments={comments}
          onAddComment={(content) => createComment.mutate({ content })}
          isAdding={createComment.isPending}
        />
      )}

      {tab === 'history' && (
        <StatusTimeline history={issue.statusHistory ?? []} />
      )}

      <AssignmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssign={(input) => assignIssue.mutate(input, { onSuccess: () => { setAssignOpen(false); refetch(); } })}
        loading={assignIssue.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteIssue.mutate(uuid!, { onSuccess: () => navigate('/issues') })}
        title="Șterge problema"
        description="Această acțiune este ireversibilă. Sigur doriți să ștergeți problema?"
        confirmLabel="Șterge"
        loading={deleteIssue.isPending}
      />
    </div>
  );
}
