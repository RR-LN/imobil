import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Web-safe notification handling
const isWeb = Platform.OS === 'web';

// Only configure handler on native platforms
if (!isWeb) {
  try {
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
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
  } catch (e) {
    console.warn('Failed to set notification handler:', e);
  }
}

export type NotificationType = 
  | 'booking_confirmed' 
  | 'booking_reminder' 
  | 'new_message' 
  | 'property_sold'
  | 'price_drop';

export interface NotificationData {
  type: NotificationType;
  [key: string]: any;
}

/**
 * Web-safe notification wrapper
 */
const safeNotificationCall = async <T>(
  fn: () => Promise<T>,
  fallback: T = null as T
): Promise<T> => {
  if (isWeb) {
    console.log('Push notifications not available on web');
    return fallback;
  }
  try {
    return await fn();
  } catch (error) {
    console.warn('Notification error:', error);
    return fallback;
  }
};

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  return safeNotificationCall(async () => {
    if (!Device.isDevice) {
      console.log('Must be on physical device for push notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id',
    });

    // Store token in Supabase
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user && data) {
      await supabase
        .from('profiles')
        .update({ push_token: data })
        .eq('id', userData.user.id);
    }

    // Configure Android channel
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5A6B5A',
      });
    }

    return data;
  });
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data: NotificationData,
  trigger?: any
): Promise<string | null> => {
  return safeNotificationCall(async () => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: trigger || { seconds: 1 } as any,
    });
    return id;
  });
};

// Legacy API for backward compatibility - used by ChatScreen.tsx and BookingScreen.tsx
export const schedulePushNotification = async (
  title: string,
  body: string,
  trigger: any = null
): Promise<string | null> => {
  return scheduleLocalNotification(title, body, { type: 'new_message' }, trigger);
};

/**
 * Schedule booking reminders
 */
export const scheduleBookingReminders = async (
  bookingId: string,
  propertyTitle: string,
  visitDate: string,
  visitTime: string
): Promise<void> => {
  if (isWeb) {
    console.log('Booking reminders not available on web');
    return;
  }

  try {
    const visitDateTime = new Date(`${visitDate}T${visitTime}`);
    const now = new Date();

    // 24 hours before
    const reminder24h = new Date(visitDateTime);
    reminder24h.setHours(visitDateTime.getHours() - 24);
    
    if (reminder24h > now) {
      await scheduleLocalNotification(
        'Lembrete de Visita',
        `Sua visita a ${propertyTitle} é amanhã às ${visitTime}`,
        { type: 'booking_reminder', bookingId },
        { date: reminder24h } as any
      );
    }

    // 1 hour before
    const reminder1h = new Date(visitDateTime);
    reminder1h.setHours(visitDateTime.getHours() - 1);
    
    if (reminder1h > now) {
      await scheduleLocalNotification(
        'Visita em Breve',
        `Sua visita a ${propertyTitle} começa em 1 hora`,
        { type: 'booking_reminder', bookingId },
        { date: reminder1h } as any
      );
    }
  } catch (error) {
    console.error('Schedule reminders error:', error);
  }
};

/**
 * Send push notification via Supabase function
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: NotificationData
): Promise<boolean> => {
  if (isWeb) {
    console.log('Push notifications not available on web');
    return false;
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) return false;

    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        token: profile.push_token,
        title,
        body,
        data,
      },
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Send push notification error:', error);
    return false;
  }
};

/**
 * Cancel notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  safeNotificationCall(async () => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  });
};

/**
 * Setup notification handlers - legacy API used by App.tsx
 */
export const setupNotificationHandlers = (
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
): { remove: () => void } => {
  if (isWeb) {
    return { remove: () => {} };
  }

  try {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        onNotificationResponse?.(response);
      }
    );

    return {
      remove: () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      },
    };
  } catch (error) {
    console.warn('Failed to set up notification listeners:', error);
    return { remove: () => {} };
  }
};

// Modern alias
export const setupNotificationListeners = setupNotificationHandlers;

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return safeNotificationCall(async () => {
    return await Notifications.getBadgeCountAsync();
  }, 0);
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  safeNotificationCall(async () => {
    await Notifications.setBadgeCountAsync(count);
  });
};

// Legacy export object for backward compatibility
export const notificationService = {
  setupNotificationHandlers,
  schedulePushNotification,
  registerForPushNotifications,
  scheduleBookingReminders,
  sendPushNotification,
  cancelNotification,
  getBadgeCount,
  setBadgeCount,
};

// Also as default for: import notificationService from '...'
export default notificationService;