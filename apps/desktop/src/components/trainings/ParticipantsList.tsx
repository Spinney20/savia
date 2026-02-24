import type { TrainingParticipantDto } from '@ssm/shared';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, Badge, Avatar } from '@/components/ui';

const CONFIRMATION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'În așteptare', color: 'text-gray-500', bg: 'bg-gray-100' },
  MANUAL: { label: 'Confirmat manual', color: 'text-success-600', bg: 'bg-success-50' },
  SELF_CONFIRMED: { label: 'Auto-confirmat', color: 'text-success-600', bg: 'bg-success-50' },
  ABSENT: { label: 'Absent', color: 'text-danger-600', bg: 'bg-danger-50' },
};

interface ParticipantsListProps {
  participants: TrainingParticipantDto[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  if (participants.length === 0) {
    return <p className="text-sm text-gray-500">Niciun participant.</p>;
  }

  return (
    <div className="space-y-2">
      {participants.map((p) => {
        const conf = CONFIRMATION_LABELS[p.confirmationMethod] ?? CONFIRMATION_LABELS.PENDING!;
        const { label, color, bg } = conf!;
        return (
          <Card key={p.employeeUuid} className="!p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={p.employeeName} size={32} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.employeeName}</p>
                  {p.confirmedAt && (
                    <p className="text-xs text-gray-400">
                      {format(new Date(p.confirmedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                    </p>
                  )}
                </div>
              </div>
              <Badge label={label} color={color} bgColor={bg} />
            </div>
            {p.notes && <p className="text-xs text-gray-500 mt-2 ml-11">{p.notes}</p>}
          </Card>
        );
      })}
    </div>
  );
}
