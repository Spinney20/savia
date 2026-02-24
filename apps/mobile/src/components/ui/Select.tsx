import { useState, useCallback } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { Text } from './Text';
import { colors } from '@/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function Select({
  label,
  placeholder = 'Selectează...',
  options,
  value,
  onChange,
  error,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  const borderColor = error ? 'border-danger' : isOpen ? 'border-primary' : 'border-gray-200';

  const handleSelect = useCallback((val: string) => {
    onChange(val);
    setIsOpen(false);
  }, [onChange]);

  return (
    <View className={`gap-1.5 ${className}`}>
      {label && (
        <Text variant="bodySmall" className="text-gray-700 font-medium">{label}</Text>
      )}
      <Pressable
        onPress={() => setIsOpen(prev => !prev)}
        className={`flex-row items-center justify-between bg-white border rounded-xl px-4 py-3.5 ${borderColor}`}
      >
        <Text variant="body" className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label ?? placeholder}
        </Text>
        <ChevronDown size={20} color={colors.gray[400]} />
      </Pressable>
      {isOpen && (
        <View className="bg-white border border-gray-200 rounded-xl mt-1 max-h-48 overflow-hidden" style={{ elevation: 4 }}>
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item.value)}
                className="flex-row items-center justify-between px-4 py-3 active:bg-gray-50"
              >
                <Text variant="body" className="text-gray-900">{item.label}</Text>
                {item.value === value && <Check size={18} color={colors.primary.DEFAULT} />}
              </Pressable>
            )}
          />
        </View>
      )}
      {error && (
        <Text variant="caption" className="text-danger ml-1">{error}</Text>
      )}
    </View>
  );
}
