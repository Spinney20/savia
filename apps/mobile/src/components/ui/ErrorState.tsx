import { View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Text } from './Text';
import { Button } from './Button';
import { colors } from '@/theme';

interface ErrorStateProps {
  title?: string;
  description?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  description,
  message = 'A apărut o eroare. Vă rugăm încercați din nou.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  const displayMessage = description ?? message;

  return (
    <View className={`flex-1 items-center justify-center px-8 py-16 ${className}`}>
      <View className="bg-danger-50 rounded-full p-5 mb-5">
        <AlertCircle size={48} color={colors.danger} strokeWidth={1.5} />
      </View>
      {title && <Text variant="h3" className="text-center text-gray-900 mb-2">{title}</Text>}
      <Text variant="body" className="text-center text-gray-700 mb-6">{displayMessage}</Text>
      {onRetry && (
        <Button variant="outline" size="md" onPress={onRetry}>Reîncearcă</Button>
      )}
    </View>
  );
}
