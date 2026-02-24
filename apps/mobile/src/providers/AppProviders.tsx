import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import ToastMessage from 'react-native-toast-message';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { toastConfig } from '@/components/ui/Toast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            {children}
            <ToastMessage config={toastConfig} position="top" topOffset={60} />
          </BottomSheetModalProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
