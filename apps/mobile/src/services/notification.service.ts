import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';

/** Configure notification handling for foreground */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Register for push notifications, returns the Expo push token or null */
export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/** Set up notification tap handler for deep linking */
export function setupNotificationListeners(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as {
      type?: string;
      id?: string;
    };

    if (data.type && data.id) {
      switch (data.type) {
        case 'issue':
          router.push(`/(app)/(tabs)/issues/${data.id}`);
          break;
        case 'inspection':
          router.push(`/(app)/(tabs)/inspections/${data.id}`);
          break;
        case 'training':
          router.push(`/(app)/(tabs)/trainings/${data.id}`);
          break;
      }
    }
  });

  return () => subscription.remove();
}
