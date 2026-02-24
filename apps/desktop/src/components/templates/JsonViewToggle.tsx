import { useState } from 'react';
import type { TemplateStructure } from '@ssm/shared';
import { Code, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewToggleProps {
  structure: TemplateStructure;
}

export function JsonViewToggle({ structure }: JsonViewToggleProps) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowJson(!showJson)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2"
      >
        {showJson ? <Eye size={14} /> : <Code size={14} />}
        {showJson ? 'Vizualizare normală' : 'Vizualizare JSON'}
      </button>
      {showJson && (
        <pre className="bg-gray-900 text-gray-100 text-xs rounded-xl p-4 overflow-auto max-h-96">
          {JSON.stringify(structure, null, 2)}
        </pre>
      )}
    </div>
  );
}
