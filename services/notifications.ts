/**
 * Push Notifications Service
 * 
 * Handles:
 * - Service Worker registration
 * - Push subscription management
 * - Notification permissions
 * - Local notifications
 */

// VAPID Public Key (generate your own for production)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// =============================================================================
// SERVICE WORKER REGISTRATION
// =============================================================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Notifications] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('[Notifications] Service Worker registered:', registration.scope);
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[Notifications] New version available');
            dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[Notifications] Service Worker registration failed:', error);
    return null;
  }
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[Notifications] Permission:', permission);
  return permission;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.warn('[Notifications] Push not supported');
    return null;
  }

  try {
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Notifications] Existing subscription found');
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[Notifications] New subscription created');
    
    // Send subscription to server
    await saveSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('[Notifications] Push subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    await subscription.unsubscribe();
    await removeSubscriptionFromServer(subscription);
    console.log('[Notifications] Unsubscribed from push');
    return true;
  }
  
  return false;
}

// =============================================================================
// LOCAL NOTIFICATIONS
// =============================================================================

export function showLocalNotification(
  title: string,
  options: NotificationOptions = {}
): void {
  if (Notification.permission !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return;
  }

  const defaultOptions: NotificationOptions & { vibrate?: number[] } = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    tag: 'greenlight-local',
    ...options
  };

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, defaultOptions);
  });
}

// Predefined notification types
export const NotificationTypes = {
  trainingReminder: (planName: string) => ({
    title: '🏋️ Zeit fürs Training!',
    body: `Dein Trainingsplan "${planName}" wartet auf dich.`,
    tag: 'training-reminder',
    data: { url: '/' }
  }),
  
  newPlanAssigned: (coachName: string, planName: string) => ({
    title: '📋 Neuer Trainingsplan!',
    body: `${coachName} hat dir "${planName}" zugewiesen.`,
    tag: 'new-plan',
    data: { url: '/' }
  }),
  
  coachingApproved: (coachName: string) => ({
    title: '✅ Coaching genehmigt!',
    body: `${coachName} hat deine Coaching-Anfrage angenommen.`,
    tag: 'coaching-approved',
    data: { url: '/' }
  }),
  
  newMessage: (senderName: string) => ({
    title: '💬 Neue Nachricht',
    body: `${senderName} hat dir geschrieben.`,
    tag: 'new-message',
    data: { url: '/chat' }
  }),
  
  goalAchieved: (goalTitle: string) => ({
    title: '🎉 Ziel erreicht!',
    body: `Du hast "${goalTitle}" erreicht. Glückwunsch!`,
    tag: 'goal-achieved',
    data: { url: '/' }
  }),
  
  prAchieved: (exerciseName: string, value: string) => ({
    title: '🏆 Neuer PR!',
    body: `${exerciseName}: ${value}`,
    tag: 'pr-achieved',
    data: { url: '/' }
  }),

  coachAssigned: (coachName: string) => ({
    title: '👤 Coach zugewiesen!',
    body: `${coachName} ist jetzt dein Coach. Schau dir sein Profil an!`,
    tag: 'coach-assigned',
    data: { url: '/' }
  }),

  newAthleteAssigned: (athleteName: string) => ({
    title: '🆕 Neuer Athlet!',
    body: `${athleteName} wurde dir zugewiesen. Mach dich vertraut!`,
    tag: 'new-athlete',
    data: { url: '/' }
  })
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });
    // Silently handle 404 in local dev (API only works in Vercel)
    if (!response.ok && response.status !== 404) {
      console.warn('[Notifications] Failed to save subscription to server');
    }
  } catch (error) {
    // Silently fail - push still works locally, just not persisted
    console.debug('[Notifications] Server subscription save skipped (local dev)');
  }
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push-subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });
  } catch (error) {
    // Silently fail in local dev
    console.debug('[Notifications] Server subscription remove skipped (local dev)');
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export async function initializeNotifications(): Promise<{
  swRegistration: ServiceWorkerRegistration | null;
  pushSubscription: PushSubscription | null;
  permission: NotificationPermission;
}> {
  const swRegistration = await registerServiceWorker();
  let pushSubscription: PushSubscription | null = null;
  let permission: NotificationPermission = 'default';

  if (swRegistration) {
    permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      pushSubscription = await subscribeToPush(swRegistration);
    }
  }

  return { swRegistration, pushSubscription, permission };
}

// =============================================================================
// NOTIFICATION PERMISSION UI HELPER
// =============================================================================

export function getNotificationStatus(): {
  supported: boolean;
  permission: NotificationPermission;
  pushSupported: boolean;
} {
  return {
    supported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    pushSupported: 'PushManager' in window
  };
}
