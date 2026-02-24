import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Pagina nu a fost găsită</h2>
      <p className="text-sm text-gray-500 mb-8">Pagina pe care o căutați nu există sau a fost mutată.</p>
      <Button icon={Home} onClick={() => navigate('/dashboard')}>
        Înapoi la Dashboard
      </Button>
    </div>
  );
}
