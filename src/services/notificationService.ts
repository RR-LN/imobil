import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
 * Register for push notifications
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Must be on physical device for push notifications');
    return null;
  }

  // Check permissions
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

  // Get push token
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with actual Expo project ID
    });
    token = data;

    // Store token in Supabase
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user && token) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userData.user.id);
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5A6B5A',
      });
    }

    return token;
  } catch (error) {
    console.error('Push notification registration error:', error);
    return null;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: { seconds: 1 } as any,
    });
    return id;
  } catch (error) {
    console.error('Schedule notification error:', error);
    return null;
  }
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
        { channelId: 'default' } as any
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
        { channelId: 'default' } as any
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
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) return false;

    // Call Supabase Edge Function
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
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Cancel notification error:', error);
  }
};

/**
 * Set up notification listeners
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): { remove: () => void } => {
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
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};
