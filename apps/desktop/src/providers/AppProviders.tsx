import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'font-sans',
          }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}
