import { useCallback, useEffect, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '@/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Caută...',
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChangeText, value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
  }, [onChangeText]);

  return (
    <View className={`flex-row items-center bg-gray-100 rounded-xl px-4 ${className}`}>
      <Search size={20} color={colors.gray[400]} />
      <TextInput
        className="flex-1 py-3 px-3 text-base text-gray-900"
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        value={localValue}
        onChangeText={setLocalValue}
        returnKeyType="search"
        autoCorrect={false}
      />
      {localValue.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <X size={18} color={colors.gray[400]} />
        </Pressable>
      )}
    </View>
  );
}
