import { useLastNotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { reminderRoute } from '@/notifications/notifier';

let handledId: string | null = null;

// Al tocar un aviso, la app pide desbloquear y luego abre "Por vencer".
// Se monta dentro de la app desbloqueada, así nunca navega con la bóveda cerrada.
export function NotificationRouter() {
  const response = useLastNotificationResponse();

  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    const route = response.notification.request.content.data?.route;
    if (id === handledId || route !== reminderRoute) return;
    handledId = id;
    // Espera a que el navegador esté montado.
    const timer = setTimeout(() => router.navigate(reminderRoute), 300);
    return () => clearTimeout(timer);
  }, [response]);

  return null;
}
