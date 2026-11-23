import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { Platform } from 'react-native';

import { reminderText, type PlannedReminder } from './reminder-plan';
import { renewalText } from './renewal-plan';

// Solo notificaciones locales: nada sale del teléfono.

const channelId = 'vencimientos';
export const reminderRoute = '/expiring';
export const renewalRoute = '/keys';

export async function configureNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Vencimientos',
      description: 'Avisos de documentos por vencer',
      importance: AndroidImportance.DEFAULT,
      // Con el teléfono bloqueado se oculta el contenido (que de todas formas es genérico).
      lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
    });
  }
}

// Pide permiso solo cuando hace falta (Android 13+ lo exige para notificar).
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function content(offset: number, renewal = false): Notifications.NotificationContentInput {
  return renewal
    ? { title: 'Kipo', body: renewalText(offset), data: { route: renewalRoute } }
    : { title: 'Kipo', body: reminderText(offset), data: { route: reminderRoute } };
}

// Reemplaza todos los avisos programados por los del plan.
export async function replaceScheduled(plan: PlannedReminder[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: [reminder.documentId, reminder.key, reminder.offset]
        .filter((p) => p !== undefined)
        .join(':'),
      content: content(reminder.offset, reminder.kind === 'renewal'),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId,
      },
    });
  }
}

// Solo en desarrollo: comprueba el criterio de la fase 4 ("dispara en 2 minutos").
export async function scheduleTestReminder(seconds = 120): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: 'prueba',
    content: content(1),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId,
    },
  });
  return true;
}
