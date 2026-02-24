import { SafeAreaView as RNSafAreaView } from 'react-native-safe-area-context';
import type { ViewProps } from 'react-native';

interface SafeAreaViewProps extends ViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeAreaView({ className = '', edges, children, ...props }: SafeAreaViewProps) {
  return (
    <RNSafAreaView className={`flex-1 bg-gray-50 ${className}`} edges={edges} {...props}>
      {children}
    </RNSafAreaView>
  );
}
