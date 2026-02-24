import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button } from '@/components/ui';
import { RefreshCw, Info } from 'lucide-react';

export default function AppSettingsPage() {
  const handleCheckUpdate = () => {
    window.electronAPI?.checkForUpdates();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Setări aplicație" className="mb-6" />

      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Despre aplicație</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Info size={16} className="text-gray-400" />
            <span className="text-gray-500">Versiune:</span>
            <span className="text-gray-900 font-medium">0.1.0</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Actualizări</h3>
        <p className="text-sm text-gray-500 mb-4">
          Verificați dacă există o versiune mai nouă a aplicației.
        </p>
        <Button variant="outline" icon={RefreshCw} onClick={handleCheckUpdate}>
          Verifică actualizări
        </Button>
      </Card>
    </div>
  );
}
