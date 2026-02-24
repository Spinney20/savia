import { useUpdate } from '@/hooks/use-update';
import { Button } from '@/components/ui';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

export function UpdateBanner() {
  const { update, downloadUpdate } = useUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!update.available || dismissed) return null;

  if (update.downloaded) {
    return (
      <div className="bg-success-50 border-b border-success-200 px-4 py-2 flex items-center justify-center gap-3">
        <span className="text-sm text-success-700 font-medium">
          Versiunea {update.version} este gata de instalare.
        </span>
        <Button
          size="sm"
          variant="primary"
          onClick={() => window.electronAPI?.installUpdate?.()}
          className="!bg-success !hover:bg-success-600"
        >
          Repornește acum
        </Button>
        <button onClick={() => setDismissed(true)} className="text-success-600 hover:text-success-700">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 border-b border-primary-200 px-4 py-2 flex items-center justify-center gap-3">
      <span className="text-sm text-primary font-medium">
        O nouă versiune ({update.version}) este disponibilă.
      </span>
      <Button
        size="sm"
        icon={Download}
        loading={update.downloading}
        onClick={downloadUpdate}
      >
        Descarcă
      </Button>
      <button onClick={() => setDismissed(true)} className="text-primary-600 hover:text-primary-700">
        <X size={16} />
      </button>
    </div>
  );
}
