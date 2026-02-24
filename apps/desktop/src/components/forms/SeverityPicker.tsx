import { cn } from '@/lib/utils';
import type { Severity } from '@ssm/shared';

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string; bg: string }[] = [
  { value: 'LOW', label: 'Scăzut', color: 'text-success-600', bg: 'bg-success-50 border-success-200' },
  { value: 'MEDIUM', label: 'Mediu', color: 'text-warning-600', bg: 'bg-warning-50 border-warning-200' },
  { value: 'HIGH', label: 'Ridicat', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { value: 'CRITICAL', label: 'Critic', color: 'text-danger-600', bg: 'bg-danger-50 border-danger-200' },
];

interface SeverityPickerProps {
  value: Severity;
  onChange: (value: Severity) => void;
  label?: string;
  error?: string;
}

export function SeverityPicker({ value, onChange, label = 'Severitate', error }: SeverityPickerProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="grid grid-cols-4 gap-2">
        {SEVERITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200',
              value === opt.value
                ? `${opt.bg} ${opt.color} ring-2 ring-offset-1 ring-current`
                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
