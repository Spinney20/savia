import { View } from 'react-native';
import { Select, type SelectOption } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

interface SitePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function SitePicker({ value, onChange, label = 'Șantier', error }: SitePickerProps) {
  const user = useAuthStore((s) => s.user);
  const sites = user?.allocatedSites ?? [];

  const options: SelectOption[] = sites.map((s) => ({
    value: s.uuid,
    label: s.name,
  }));

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
