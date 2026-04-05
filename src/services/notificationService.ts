import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

const isWeb = Platform.OS === 'web';

// Configure notification settings (only on native)
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const notificationService = {
  // Register for push notifications and save token to profile
  async registerForPushNotifications(): Promise<string | null> {
    // Web doesn't support push notifications through Expo
    if (isWeb) {
      return null;
    }

    try {
      if (!Device.isDevice) {
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      // Save token to user's profile in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: tokenData.data })
          .eq('id', session.user.id);

        if (error) {
          console.error('Error saving push token:', error);
          return null;
        }
      }

      return tokenData.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  // Schedule a local immediate notification (for testing)
  async schedulePushNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string | null> {
    if (isWeb) {
      // Web: use browser notifications if available and permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, data });
        return 'web-notification';
      }
      return null;
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data ?? {},
        },
        trigger: null, // Immediate notification
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling push notification:', error);
      return null;
    }
  },

  // Setup notification handlers for when app is in foreground
  setupNotificationHandlers(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationSelected: (response: Notifications.NotificationResponse) => void
  ): { remove: () => void } {
    // Web doesn't support notification handlers through Expo
    if (isWeb) {
      return { remove: () => {} };
    }

    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
    const notificationSelectedSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationSelected);

    // Return cleanup function
    return {
      remove: () => {
        notificationReceivedSubscription.remove();
        notificationSelectedSubscription.remove();
      }
    };
  },

  // Helper to get current device's push token
  async getDevicePushToken(): Promise<string | null> {
    if (isWeb) {
      return null;
    }

    try {
      const { data } = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      return data;
    } catch (error) {
      console.error('Error getting device push token:', error);
      return null;
    }
  }
};
