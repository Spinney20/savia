import ToastMessage, { BaseToast, ErrorToast, type BaseToastProps } from 'react-native-toast-message';
import { colors } from '@/theme';

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.success, borderLeftWidth: 4, borderRadius: 12 }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 14, fontWeight: '600', color: colors.gray[800] }}
      text2Style={{ fontSize: 13, color: colors.gray[500] }}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.danger, borderLeftWidth: 4, borderRadius: 12 }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 14, fontWeight: '600', color: colors.gray[800] }}
      text2Style={{ fontSize: 13, color: colors.gray[500] }}
    />
  ),
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.info, borderLeftWidth: 4, borderRadius: 12 }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 14, fontWeight: '600', color: colors.gray[800] }}
      text2Style={{ fontSize: 13, color: colors.gray[500] }}
    />
  ),
};

export { ToastMessage };
