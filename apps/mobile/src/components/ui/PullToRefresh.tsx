import { RefreshControl, type RefreshControlProps } from 'react-native';
import { colors } from '@/theme';

interface PullToRefreshProps extends Omit<RefreshControlProps, 'colors' | 'tintColor'> {}

export function PullToRefresh(props: PullToRefreshProps) {
  return (
    <RefreshControl
      colors={[colors.primary.DEFAULT]}
      tintColor={colors.primary.DEFAULT}
      {...props}
    />
  );
}
