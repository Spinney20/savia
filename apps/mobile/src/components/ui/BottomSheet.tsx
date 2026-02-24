import { useCallback, forwardRef } from 'react';
import { View } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetProps as GorhomProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Text } from './Text';

interface BottomSheetProps extends Partial<GorhomProps> {
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  function BottomSheet({ title, children, snapPoints = ['50%'], ...props }, ref) {
    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
        />
      ),
      [],
    );

    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#d1d5db', width: 40 }}
        backgroundStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        {...props}
      >
        <View className="px-4 pb-4">
          {title && (
            <Text variant="h3" className="mb-4">{title}</Text>
          )}
          {children}
        </View>
      </GorhomBottomSheet>
    );
  },
);

export { default as GorhomBottomSheet } from '@gorhom/bottom-sheet';
