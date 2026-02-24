import { Select } from '@/components/ui';
import { useAuthStore } from '@/stores';

interface SitePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

export function SitePicker({ value, onChange, error, label = 'Șantier' }: SitePickerProps) {
  const user = useAuthStore((s) => s.user);
  const sites = user?.allocatedSites ?? [];

  const options = sites.map((s) => ({ value: s.uuid, label: s.name }));

  return (
    <Select
      label={label}
      placeholder="Selectează șantierul..."
      options={options}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
