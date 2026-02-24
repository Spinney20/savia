import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UpdateBanner } from './UpdateBanner';
import { CommandPalette } from './CommandPalette';
import { ErrorBoundary } from './ErrorBoundary';
import { Spinner } from '@/components/ui';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useKeyboardShortcuts();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Spinner size={32} message="Se încarcă..." />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UpdateBanner />
        <Header />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}
