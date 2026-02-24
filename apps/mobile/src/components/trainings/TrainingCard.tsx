import { View } from 'react-native';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { GraduationCap, Users, Calendar } from 'lucide-react-native';
import type { TrainingDto, TrainingType } from '@ssm/shared';
import { Card, Text, Badge } from '@/components/ui';
import { colors } from '@/theme';

const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  ANGAJARE: 'La angajare',
  PERIODIC: 'Periodic',
  SCHIMBARE_LOC_MUNCA: 'Schimbare loc',
  REVENIRE_MEDICAL: 'Revenire medical',
  SPECIAL: 'Special',
  ZILNIC: 'Zilnic',
};

const TRAINING_TYPE_COLORS: Record<TrainingType, { bg: string; text: string }> = {
  ANGAJARE: { bg: 'bg-blue-50', text: 'text-blue-700' },
  PERIODIC: { bg: 'bg-green-50', text: 'text-green-700' },
  SCHIMBARE_LOC_MUNCA: { bg: 'bg-orange-50', text: 'text-orange-700' },
  REVENIRE_MEDICAL: { bg: 'bg-purple-50', text: 'text-purple-700' },
  SPECIAL: { bg: 'bg-red-50', text: 'text-red-700' },
  ZILNIC: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

interface TrainingCardProps {
  training: TrainingDto;
  onPress?: () => void;
}

export function TrainingCard({ training, onPress }: TrainingCardProps) {
  const typeLabel = TRAINING_TYPE_LABELS[training.trainingType];
  const typeColor = TRAINING_TYPE_COLORS[training.trainingType];
  const date = format(new Date(training.conductedAt), 'dd MMM yyyy', { locale: ro });

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center justify-between mb-2">
        <Badge
          label={typeLabel}
          bgColor={typeColor.bg}
          color={typeColor.text}
        />
        <View className="flex-row items-center gap-1">
          <Calendar size={14} color={colors.gray[400]} />
          <Text variant="caption" muted>{date}</Text>
        </View>
      </View>
      <Text variant="h3" className="text-gray-900 mb-2">{training.title}</Text>
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-1">
          <Users size={14} color={colors.gray[500]} />
          <Text variant="bodySmall" muted>
            {training.participantCount} {training.participantCount === 1 ? 'participant' : 'participanți'}
          </Text>
        </View>
        <Text variant="caption" muted>•</Text>
        <Text variant="bodySmall" muted>{training.conductorName}</Text>
      </View>
    </Card>
  );
}