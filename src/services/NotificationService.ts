import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Core Notification Triggers
 */

// 1. Streak Saver (Daily reminder at a specific time)
export async function scheduleStreakReminder(hour: number = 20, minute: number = 0) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't break your streak! 📖",
      body: "You haven't read your daily portion yet. Take a Lahzah (moment) to connect with the Quran.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } as any,
  });
}

// 2. Friday Kahf Reminder
export async function scheduleFridayKahfReminder() {
  // Assuming a weekly trigger on Friday at 9:00 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Sunnah of Friday 🌟",
      body: "Don't forget to read Surah Al-Kahf today to have a light shining for you between the two Fridays.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // 1 = Sunday, 6 = Friday
      hour: 9,
      minute: 0,
    } as any,
  });
}

// 3. Spaced Repetition (Hifz) - Adhoc triggers for review sessions
export async function scheduleHifzReview(minutesFromNow: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Hifz Review Ready 🧠",
      body: "Your spaced repetition review session is ready. Solidify your memorization now.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutesFromNow * 60,
      repeats: false,
    } as any,
  });
}

// 4. Time-based general reminders
export async function scheduleGeneralReminder(title: string, body: string, hoursFromNow: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: hoursFromNow * 3600,
      repeats: false,
    } as any,
  });
}

// Clear all triggers
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
