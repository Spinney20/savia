import { useState, useCallback } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, getDaysInMonth, setDate, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Text } from './Text';
import { Button } from './Button';
import { colors } from '@/theme';

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

interface DatePickerProps {
  label?: string;
  value?: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Selectează data...',
  error,
  className = '',
  minDate,
  maxDate,
}: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ?? new Date());

  const borderColor = error ? 'border-danger' : 'border-gray-200';
  const formattedDate = value ? format(value, 'dd.MM.yyyy', { locale: ro }) : null;

  const handleOpen = useCallback(() => {
    setViewDate(value ?? new Date());
    setVisible(true);
  }, [value]);

  const handleSelect = (day: number) => {
    const selected = startOfDay(setDate(viewDate, day));
    onChange(selected);
    setVisible(false);
  };

  const goMonth = (delta: number) => {
    setViewDate((prev) => {
      const m = prev.getMonth() + delta;
      const y = prev.getFullYear() + Math.floor(m / 12);
      const newMonth = ((m % 12) + 12) % 12;
      return new Date(y, newMonth, 1);
    });
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  // Adjust so Monday = 0
  const startOffset = (firstDayOfWeek + 6) % 7;

  const isSelected = (day: number) =>
    value &&
    value.getDate() === day &&
    value.getMonth() === viewDate.getMonth() &&
    value.getFullYear() === viewDate.getFullYear();

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  return (
    <View className={`gap-1.5 ${className}`}>
      {label && (
        <Text variant="bodySmall" className="text-gray-700 font-medium">{label}</Text>
      )}
      <Pressable
        onPress={handleOpen}
        className={`flex-row items-center bg-white border rounded-xl px-4 py-3.5 ${borderColor}`}
      >
        <Calendar size={20} color={colors.gray[400]} style={{ marginRight: 12 }} />
        <Text variant="body" className={formattedDate ? 'text-gray-900' : 'text-gray-400'}>
          {formattedDate ?? placeholder}
        </Text>
      </Pressable>
      {error && (
        <Text variant="caption" className="text-danger ml-1">{error}</Text>
      )}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center items-center px-6" onPress={() => setVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full p-4">
            {/* Month/Year header */}
            <View className="flex-row items-center justify-between mb-4">
              <Pressable onPress={() => goMonth(-1)} hitSlop={12} className="p-2">
                <ChevronLeft size={20} color={colors.gray[600]} />
              </Pressable>
              <Text variant="body" className="font-semibold text-gray-900">
                {MONTHS_RO[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <Pressable onPress={() => goMonth(1)} hitSlop={12} className="p-2">
                <ChevronRight size={20} color={colors.gray[600]} />
              </Pressable>
            </View>

            {/* Day-of-week headers */}
            <View className="flex-row mb-1">
              {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map((d) => (
                <View key={d} className="flex-1 items-center py-1">
                  <Text variant="caption" className="text-gray-400 font-semibold">{d}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View className="flex-row flex-wrap">
              {Array.from({ length: startOffset }, (_, i) => (
                <View key={`empty-${i}`} className="w-[14.28%] h-10" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const today = isToday(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => handleSelect(day)}
                    className="w-[14.28%] h-10 items-center justify-center"
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        selected ? 'bg-primary' : today ? 'bg-primary-50' : ''
                      }`}
                    >
                      <Text
                        variant="bodySmall"
                        className={`font-medium ${
                          selected ? 'text-white' : today ? 'text-primary' : 'text-gray-900'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Actions */}
            <View className="flex-row justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" onPress={() => setVisible(false)}>
                Anulează
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  onChange(startOfDay(new Date()));
                  setVisible(false);
                }}
              >
                Azi
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
